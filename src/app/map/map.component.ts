import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {Auth, Storage} from 'aws-amplify';
import {
  control,
  Control,
  GeoJSON,
  latLng,
  Layer,
  LayerGroup,
  layerGroup,
  LeafletMouseEvent,
  Map,
  tileLayer,
} from 'leaflet';
import 'jquery-ui/ui/widgets/slider.js';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Observable, Subscription, timer} from "rxjs";
import * as geojson from "geojson";
import {DateRange, DateRangeSliderOptions} from "./date-range-slider/date-range-slider.component";
import {TweetProcessService} from "./services/tweet-process.service";
import {getColor, getFeatureStyle, LayerStyleService} from "./services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {PolygonData} from "./types";


type MapLayers = ByRegionType<LayerGroup>
type NumberLayers = RegionData<LayerGroup, LayerGroup, LayerGroup>;
type RegionData<R, S, T> = { stats: R; count: S; embed?: T };
type ColorFunctions = RegionData<any, any, any>
type ColorData = RegionData<{ colors: string[], values: number[] }, { colors: string[], values: number[] }, any>;
type BasemapControl = { polygon: MapLayers; numbers: NumberLayers };

type ByRegionType<T> = { fine: T; coarse: T; county: T };

@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent implements OnInit, OnDestroy {
  private _tweetInfo: any = {};
  private _statsLayer: LayerGroup = layerGroup();
  private _countyLayer: LayerGroup = layerGroup(); //dummy layers to fool layer control
  private _searchParams: Observable<Params>;
  private _map: Map;

  private _numberLayers: NumberLayers = {"stats": null, "count": null};
  private _polyLayers: MapLayers = {"county": null, "coarse": null, "fine": null};
  private _basemapControl: BasemapControl = {"numbers": this._numberLayers, "polygon": this._polyLayers};
  private _polygonData: { fine: PolygonData; coarse: PolygonData; county: PolygonData } = {
    "county": fgsData,
    "coarse": coarseData,
    "fine":   fineData
  };
  public _activeNumber: string = "stats";
  private _activePolys: string = "county";
  private _geojson = {};
  private _gridSizes: ByRegionType<string> = {"county": "county", "coarse": "15", "fine": "60"};
  private _stats: ByRegionType<RegionData<any, any, any>> = {
    "county": {stats: {}, count: {}, embed: {}},
    "coarse": {stats: {}, count: {}, embed: {}},
    "fine":   {stats: {}, count: {}, embed: {}}
  };
  private _processedTweetInfo: ByRegionType<RegionData<any, any, any>> = {
    county: {stats: {}, count: {}, embed: {}},
    coarse: {stats: {}, count: {}, embed: {}},
    fine:   {stats: {}, count: {}, embed: {}},
  };
  public _colorData: ColorData = {
    stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
    count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
  };

  public colorFunctions: ColorFunctions = {stats: null, count: null};
  public showTwitterTimeline: boolean;

  private _defaultMax = 0;
  private _defaultMin = -24 * 60 + 1;
  public sliderOptions: DateRangeSliderOptions = {
    max:      0,
    min:      this._defaultMin,
    startMin: this._defaultMin,
    startMax: this._defaultMax
  };
  private _oldClicked: (LeafletMouseEvent | "") = "";
  private _clicked: (LeafletMouseEvent | "") = "";
  private timeKeys: any; //The times in the input JSON
  private _lcontrols: { "numbers": Control.Layers, "polygon": Control.Layers } = {"numbers": null, "polygon": null};
  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _params: Params;
  public embeds: string;
  public selectedRegion: string;
  public exceedenceProbability: number;
  public tweetCount: number;
  public tweetsVisible: boolean = false;
  public twitterPanelHeader: boolean;
  private _layersAreStale: boolean;
  private _resetLayersTimer: Subscription;
  private _stateUpdateTimer: Subscription;
  public loading: boolean = false;
  public ready: boolean = false;
  private _stateIsStale: boolean;
  private _newParams: Partial<Params>;
  private _twitterIsStale: boolean;
  private _twitterUpdateTimer: Subscription;
  private _feature;


  updateSearch(params: Partial<Params>) {
    console.log("updateSearch");
    this._newParams = params;
    this._stateIsStale = true;
  }

  options = {
    layers: [
      tileLayer(
        'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg',
        {
          maxZoom:     18,
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
                         '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                         'Imagery © <a href="http://mapbox.com">Mapbox</a>',
          id:          'mapbox.streets'
        }),
      this._statsLayer,
      this._countyLayer
    ],
    zoom:   6,
    center: latLng([53, -2])
  };


  constructor(private _router: Router, private route: ActivatedRoute, private ngZone: NgZone,
              private _tweetProcessor: TweetProcessService, private _layerStyles: LayerStyleService,
              private _notify: NotificationService) {
    //save the query parameter observable
    this._searchParams = this.route.queryParams;

       // Preload the cacheable JSON files asynchronously
    // this gets called again in onMapReady()
    // But the values should be in the browser cache by then
    this.fetchJson().then(() => {});
  }

  /**
   * Called when the map element has finished initialising.
   * @param map
   */
  onMapReady(map: Map) {
    console.log("onMapReady");

    this._map = map;
    this.fetchJson()
        .then(() => this.init(map))
        .catch(err => {
          this._notify.show("Error while loading map data");
          console.log(err);
        });
  }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  private fetchJson(): Promise<any> {
    console.log("fetchJson");
    return fetch("assets/data/county_stats.json")
      .then(response => response.json())
      .then(json => {
        this._stats.county = json;
      })
      .then(() =>
              fetch("assets/data/coarse_stats.json")
                .then(response => response.json())
                .then(json => {
                  this._stats.coarse = json;
                }))
      .then(() => fetch("assets/data/fine_stats.json")
        .then(response => response.json())
        .then(json => {
          this._stats.fine = json;
        }));
  }

  /**
   * Update the map from the query parameters.
   *
   * @param params the new value for the query parameters.
   */
  private updateMap(params: Params) {
    console.log("Updating map with params");
    console.log(params);
    this._params = params;
    const {lng, lat, zoom, active_number, selected, min_offset, max_offset} = params;
    if (typeof min_offset !== "undefined") {
      this.sliderOptions.startMin = min_offset;
      this._defaultMin = min_offset;
    }


    if (typeof max_offset !== "undefined") {
      this._defaultMax = max_offset;
      this.sliderOptions.startMax = max_offset;
    }

    if (typeof lat != "undefined" && typeof lng != "undefined") {
      this.options.center = latLng(lat, lng);
    }
    if (typeof zoom != "undefined") {
      this.options.zoom = zoom;
    }


    // if (typeof active_polys != "undefined") {
    //   this.options.zoom = zoom;
    // }

    const numberLayerName: string = typeof active_number !== "undefined" ? active_number : "stats";
    const numberLayer: LayerGroup = this._numberLayers[numberLayerName];
    if (this._map) {
      for (let layer in this._numberLayers) {
        if (layer !== numberLayerName) {
          console.log("Removing " + layer);
          this._map.removeLayer(this._numberLayers[layer]);
        }
      }
      for (let layer in this._numberLayers) {
        if (layer === numberLayerName) {
          console.log("Adding " + layer);
          this._map.addLayer(this._numberLayers[layer]);

        }
      }
    }
    const polygonLayerName: string = typeof selected !== "undefined" ? selected : "county";
    const polygonLayer: LayerGroup = this._polyLayers[polygonLayerName];
    if (this._map) {
      for (let layer in this._polyLayers) {
        if (layer !== polygonLayerName) {
          console.log("Removing " + layer);
          this._map.removeLayer(this._polyLayers[layer]);
        }
      }
      for (let layer in this._polyLayers) {
        if (layer === polygonLayerName) {
          console.log("Adding " + layer);
          this._map.addLayer(this._polyLayers[layer]);

        }
      }
    }
    this._twitterIsStale= true;

    if(typeof selected !== "undefined") {
      this.updateTwitter();
      this.showTweets();
    }
    // if (typeof min_offset !== "undefined" && typeof min_offset !== "undefined") {
    //   ($(".timeslider") as any).slider("option", "values", [min_offset, max_offset]);
    // }
    return undefined;
  }

  /**
   * Loads the live data from S3 storage securely.
   */
  private async loadLiveData() {
    console.log("loadLiveData");
    return Storage.get("live.json")
                  .then((url: any) =>
                          fetch(url.toString())
                            .then(response => response.json()));
  }


  /**
   * This method does all the heavy lifting and is called when
   * the map is ready and data is loaded.
   * @param map the leaflet.js Map
   */
  private async init(map: Map) {
    console.log("init");

    //Listeners to push map state into URL
    map.addEventListener("dragend", () => {
      return this.ngZone.runOutsideAngular(
        () => this.updateSearch({lat: this._map.getCenter().lat, lng: this._map.getCenter().lng}))
    });

    map.addEventListener("zoomend", () => {
      return this.ngZone.runOutsideAngular(() => this.updateSearch({zoom: this._map.getZoom()}));
    });


    //define the layers for the different counts
    this._numberLayers.stats = layerGroup().addTo(map);
    this._numberLayers.count = layerGroup();

    //layers for the different polygons
    this._polyLayers["county"] = layerGroup().addTo(map);
    this._polyLayers["coarse"] = layerGroup();
    this._polyLayers["fine"] = layerGroup();


    const newColorFunctions: ColorFunctions = {stats: {}, count: {}};
    for (let key in this._colorData) {
      newColorFunctions[key].getColor = getColor.bind(newColorFunctions[key], this._colorData[key].values,
                                                      this._colorData[key].colors);
      newColorFunctions[key].getFeatureStyle = getFeatureStyle.bind(newColorFunctions[key], this._colorData[key].values,
                                                                    this._colorData[key].colors,
                                                                    key);
    }
    //This assignment triggers the change to the legend
    this.colorFunctions = newColorFunctions;

    map.on('baselayerchange', (e: any) => {
      if (e.name in this._basemapControl.polygon) {
        this._activePolys = e.name;
        this.updateSearch({active_polygon: e.name});
        this.resetLayers(true);
      } else {
        this._activeNumber = e.name;
        this.updateSearch({active_number: e.name});
      }
    });

    // //Use the current query parameters to update map state
    // this.updateMap(this._params);

    this.setupCountStatsToggle();
    await this.readData(); //reads data and sets up map
    setInterval(() => this.readData(), 60000);

    //Every time the search parameters change, the map will be updated
    this._searchParams.subscribe(params => this.updateMap(params));
  }

  //add = extra minutes
  private setupCountStatsToggle() {
    console.log("setupCountStatsToggle()");
    for (let key in this._basemapControl) {
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key] = control.layers(this._basemapControl[key], {}).addTo(this._map);
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key].setPosition('topleft');
    }

  }


  /**
   * Mouse over event.
   * @param e
   */
  public highlightFeature(e: LeafletMouseEvent) {
    console.log("highlightFeature()");
    this._layerStyles.dohighlightFeature(e.target);
    const feature = e.target.feature;
    const exceedenceProbability: number = Math.round(feature.properties.stats * 100) / 100;
    const region: string = this.toTitleCase(feature.properties.name);
    const count: number = feature.properties.count;
    let text = "" +
      `<div>Region: ${region}</div>`;
    if (count > 0) {
      text = text +
        `<div>Count: ${count}</div>`;
      if ("" + exceedenceProbability != "NaN") {
        text = text + `<div>Exceedence: ${exceedenceProbability}</div>`;
      }
    }

    e.target.bindTooltip(text).openTooltip();
  }

  /**
   * Update the Twitter panel
   * @param props
   */
  private updateTwitterPanel(props?: any) {
    console.log("updateTwitterPanel()");
    if (props.properties.count > 0) {
      this.updateTwitterHeader(props);
      this.embeds = this._processedTweetInfo[this._activePolys].embed[props.properties.name];
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = true;
      this.showTweets()
    } else {
      this.hideTweets()
    }

  };

  private updateTwitterHeader(props: any) {
    this.exceedenceProbability = Math.round(props.properties.stats * 100) / 100;
    this.selectedRegion = this.toTitleCase(props.properties.name);
    this.tweetCount = props.properties.count;
  }

  /**
   * Mouse out event.
   * @param e
   */
  public resetHighlight(e: LeafletMouseEvent) {
    console.log("resetHighlight");


    this._geojson[this._activeNumber].resetStyle(e.target);
    if (this._clicked != "") {
      this._layerStyles.dohighlightFeature(this._clicked.target);
    }
  }

  /**
   * Mouse click event
   * @param e
   */
  zoomToFeature(e: LeafletMouseEvent) {
    console.log("zoomToFeature");
    console.log(e.target.feature.properties.name);
    this.updateSearch({"selected": e.target.feature.properties.name});
    this.updateTwitterPanel(e.target.feature);
    this._oldClicked = this._clicked;
    this._clicked = e;
    this._layerStyles.dohighlightFeature(e.target);
    // e.target.setStyle({
    //                     weight:      3,
    //                     color:       '#FF00FF',
    //                     dashArray:   '',
    //                     fillOpacity: 0.4
    //                   });
    if (this._oldClicked != "") {
      this.resetHighlight(this._oldClicked);
    }
  }

  toTitleCase(str) {
    return str.replace(/\S+/g, str => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase());
  }

  onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: Layer) {
    console.log("onEachFeature");
    const mc = this;
    // If this feature is referenced in the URL query paramter selected
    // e.g. ?...&selected=powys
    // then highlight it and update Twitter
    if (feature.properties.name === this._params.selected) {
      console.log("Matched " + feature.properties.name);

      //Put the selection outline around the feature
      this._layerStyles.dohighlightFeature(layer);

      //Update the Twitter panel with the changes
      this._feature = feature;
    }

    layer.on({
               mouseover: (e) => this.ngZone.runOutsideAngular(() => mc.highlightFeature(e)),
               mouseout:  (e) => this.ngZone.runOutsideAngular(() => mc.resetHighlight(e)),
               click:     (e) => this.ngZone.runOutsideAngular(() => mc.zoomToFeature(e))
             });
  }


  ngOnInit() {
    this._resetLayersTimer = timer(0, 50).subscribe(() => {
      if (this._layersAreStale) {
        try {
          this.update();
          this.resetLayers(false);
          this._layersAreStale = false;
        } catch (e) {
          console.error(e);
        }
      }
    });

    this._stateUpdateTimer = timer(0, 2000).subscribe(() => {
      if (this._stateIsStale) {
        this._router.navigate([], {
          queryParams:         this._newParams,
          queryParamsHandling: 'merge'
        });
        this._stateIsStale = false;
      }
    });

    this._twitterUpdateTimer = timer(0, 2000).subscribe(() => {
      if (this._twitterIsStale) {
        this.updateTwitter();
        this._twitterIsStale = false;
      }
    });


  }

  ngOnDestroy() {
    this._resetLayersTimer.unsubscribe();
    this._stateUpdateTimer.unsubscribe();
    this._twitterUpdateTimer.unsubscribe();
  }

  ///////////////////////
  //Add the polygons
  ///////////////////////
  resetLayers(clear_click) {
    console.log("resetLayers("+clear_click+")");

    for (let key in this._basemapControl["numbers"]) {
      console.log(key);
      if (this._numberLayers[key] != null) {
        // noinspection JSUnfilteredForInLoop
        this._numberLayers[key].clearLayers();

        // noinspection JSUnfilteredForInLoop
        this._geojson[key] = new GeoJSON(this._polygonData[this._activePolys], {
          style:         (feature) => this.colorFunctions[key].getFeatureStyle(feature),
          onEachFeature: (f, l) => this.onEachFeature(f, l)
        }).addTo(this._numberLayers[key]);
      } else {
        console.log("Null layer "+key);
      }
      if (clear_click) {
        console.log("resetLayers() clear_click");
        if (this._clicked != "") {
          this._geojson[this._activeNumber].resetStyle(this._clicked);
        }
        this._clicked = "";
        this._feature = null;
      }
    }
  }

  /////////////////////////////
  //get datafiles & init
  /////////////////////////////
  async readData() {
    console.log("readData()");
    this.loading = true;
    const userInfo = await Auth.currentUserInfo();
    if (userInfo != null) {
      try {
        this._tweetInfo = await this.loadLiveData();
        console.log("Loading live data completed");
        this.timeKeys = this._tweetProcessor.getTimes(this._tweetInfo);
        this.initSlider();
        this._layersAreStale = true;
        this.ready = true;
        this.loading = false;
      } catch (e) {
        this._notify.show("Error while loading live map data");
        console.log("Loading data failed " + e);
        console.log(e);
        this.loading = false;
      }
    } else {
      console.log("User logged out, not loading live data");
    }

  }


  private update() {
    this._tweetProcessor.processData(this._tweetInfo,
                                     this._processedTweetInfo,
                                     this._polygonData,
                                     this._stats,
                                     this._B,
                                     this.timeKeys.slice(-this._defaultMax, -this._defaultMin),
                                     this._gridSizes);
    if (this._clicked != "") {
      this.updateTwitterHeader(this._clicked.target.feature);
    }
  }

  ///////////////////////////
  //Slider, start after reading JSON
  ///////////////////////////
  initSlider() {
    console.log("initSlider()");
    if (this.timeKeys) {
      this._defaultMin = Math.max(this._defaultMin, -(this.timeKeys.length - 1));
      this.sliderOptions = {
        max:      0,
        min:      -this.timeKeys.length + 1,
        startMin: this._defaultMin,
        startMax: this._defaultMax
      };

    }
  }

  private disableMap() {
    this._map.touchZoom.disable();
    this._map.doubleClickZoom.disable();
    this._map.scrollWheelZoom.disable();
    this._map.boxZoom.disable();
    this._map.keyboard.disable();
    this._map.dragging.disable();
  }

  private enableMap() {
    this._map.touchZoom.enable();
    this._map.doubleClickZoom.enable();
    this._map.scrollWheelZoom.enable();
    this._map.boxZoom.enable();
    this._map.keyboard.enable();
    this._map.dragging.enable();
  }

  private hideTweets() {
    this.tweetsVisible = false;
  }

  private showTweets() {
    this.tweetsVisible = true;
  }

  public sliderChange(range: DateRange) {
    console.log("sliderChange()");
    const {lower, upper} = range;
    this._defaultMax = upper;
    this._defaultMin = lower;
    this.updateSearch({min_offset: lower, max_offset: upper});
    this._layersAreStale = true;
    this._twitterIsStale = true;

  }

  private updateTwitter() {
    if (!this.tweetsVisible) {
      this._clicked = "";
      this._feature = null;
    }
    if (this._clicked != "") {
      this.updateTwitterPanel(this._clicked.target.feature);
    } else if (this._feature !== null) {
      this.updateTwitterPanel(this._feature);
    }
  }
}
