import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {dohighlightFeature, getColor, getFeatureStyle} from './layerStyle';
import {getTimes, processData} from './processTweets';
import {Storage} from 'aws-amplify';
import {
  control,
  Control,
  ControlOptions,
  DomUtil,
  GeoJSON, latLng,
  Layer,
  LayerGroup,
  layerGroup,
  LeafletMouseEvent,
  Map, tileLayer,
} from 'leaflet';
import 'jquery-ui/ui/widgets/slider.js';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {Observable, Subscription, timer} from "rxjs";
import * as geojson from "geojson";
import {DateRange, DateRangeSliderOptions} from "../date-range-slider/date-range-slider.component";



@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent implements OnInit, OnDestroy {
  private _tweetInfo: any = {};
  private stats_layer = layerGroup();
  private county_layer = layerGroup(); //dummy layers to fool layer control
  private _searchParams: Observable<Params>;
  private _map: Map;

  private _numberLayers: { "stats": LayerGroup, "count": LayerGroup } = {"stats": null, "count": null};
  private _polyLayers: { "county": LayerGroup, "coarse": LayerGroup, "fine": LayerGroup } = {
    "county": null,
    "coarse": null,
    "fine":   null
  };
  private _basemapControl: any;
  private _polygonData = {"county": fgsData, "coarse": coarseData, "fine": fineData};
  public _activeNumber: string = "stats";
  private _activePolys: string = "county";
  private _geojson = {};
  private _gridSizes = {"county": "county", "coarse": "15", "fine": "60"};
  private _processedTweetInfo = {
    "county": {"stats": {}, "count": {}, "embed": {}},
    "coarse": {"stats": {}, "count": {}, "embed": {}},
    "fine":   {"stats": {}, "count": {}, "embed": {}},
  };
  public _colorData = {
    stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
    count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
  };

  public _colorFunctions = {stats: {}, count: {}};
  private _oldClicked: (LeafletMouseEvent | "") = "";
  private clicked: (LeafletMouseEvent | "") = "";
  private timeKeys: any; //The times in the input JSON
  private _defaultMax = 0;
  private _defaultMin = -24 * 60 + 1;
  private _changedPolys: boolean = false;
  private _lcontrols: { "numbers": Control.Layers, "polygon": Control.Layers } = {"numbers": null, "polygon": null};
  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days
  private _params: Params;
  embeds: string;
  selectedRegion: string;
  exceedenceProbability: number;
  tweetCount: number;
  _showTweets: boolean = false;
  twitterPanelHeader: boolean;
  public showTwitterTimeline: boolean;
  public sliderOptions: DateRangeSliderOptions = {
    max:      0,
    min:      this._defaultMin,
    startMin: this._defaultMin,
    startMax: this._defaultMax
  };
  private _layersAreStale: boolean;
  private resetLayersTimer: Subscription;


  updateSearch(params: Partial<Params>) {
    console.log("updateSearch");

    return this._router.navigate([], {
      queryParams:         params,
      queryParamsHandling: 'merge'
    })
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
      this.stats_layer,
      this.county_layer
    ],
    zoom:   6,
    center: latLng([53, -2])
  };

  stats = {"county": {}, "coarse": {}, "fine": {}};

  constructor(private _router: Router, private route: ActivatedRoute, private ngZone: NgZone) {
    //save the query parameter observable
    this._searchParams = this.route.queryParams;

    //Every time the search parameters change, the map will be updated
    this._searchParams.subscribe(params => this.updateMap(params));

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
        .catch(err => console.log(err));
  }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  private fetchJson(): Promise<any> {
    console.log("fetchJson");
    return fetch("assets/data/county_stats.json")
      .then(response => response.json())
      .then(json => {
        this.stats.county = json;
      })
      .then(() =>
              fetch("assets/data/coarse_stats.json")
                .then(response => response.json())
                .then(json => {
                  this.stats.coarse = json;
                }))
      .then(() => fetch("assets/data/fine_stats.json")
        .then(response => response.json())
        .then(json => {
          this.stats.fine = json;
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
    const {lng, lat, zoom, active_number, active_polygon, min_offset, max_offset} = params;
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

    const numberLayerName = typeof active_number !== "undefined" ? active_number : "stats";
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
    const polygonLayerName = typeof active_polygon !== "undefined" ? active_polygon : "county";
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

    // if (typeof min_offset !== "undefined" && typeof min_offset !== "undefined") {
    //   ($(".timeslider") as any).slider("option", "values", [min_offset, max_offset]);
    // }

    return undefined;
  }

  /**
   * Loads the live data from S3 storage securely.
   */
  private loadLiveData() {
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
  private init(map: Map) {
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

    this._basemapControl = {"numbers": this._numberLayers, "polygon": this._polyLayers};

    for (let key in this._colorData) {
      this._colorFunctions[key].getColor = getColor.bind(null, this._colorData[key].values,
                                                         this._colorData[key].colors);
      this._colorFunctions[key].getFeatureStyle = getFeatureStyle.bind(null, this._colorData[key].values,
                                                                       this._colorData[key].colors,
                                                                       key);
    }



    this.setupCountStatsToggle();
    this.readData(); //reads data and sets up map
    setInterval(() => this.readData(), 60000);

    map.on('baselayerchange', (e: any) => {
      if (e.name in this._basemapControl["polygon"]) {
        this._activePolys = e.name;
        this.updateSearch({active_polygon: e.name});
        this.resetLayers(true);
      } else {
        this._activeNumber = e.name;
        this.updateSearch({active_number: e.name});
      }
    });

    //Use the current query parameters to update map state
    this.updateMap(this._params);


  }

  //add = extra minutes
  cleanDate(tstring, add) {
    var date = new Date(tstring.substring(0, 4), tstring.substring(4, 6) - 1, tstring.substring(6, 8),
                        tstring.substring(8, 10), +tstring.substring(10, 12) + add, 0, 0);
    //var date = new Date( tstring.substring(0,4), tstring.substring(4,6)-1, tstring.substring(6,8), +tstring.substring(8,10)+add, 0, 0, 0);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  private setupCountStatsToggle() {
    ////////////////////////////
    //count / stats toggle
    ////////////////////////////
    for (let key in this._basemapControl) {
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key] = control.layers(this._basemapControl[key], {}).addTo(this._map);
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key].setPosition('topleft');
    }

  }


  /////////////////////////
  //React to Mouse
  /////////////////////////
  public highlightFeature(e: LeafletMouseEvent) {
    console.log("highlightFeature");
    dohighlightFeature(e.target);
  }

  public displayText(e: LeafletMouseEvent) {
    console.log("displayText");
    this.update_table(e.target.feature);
  }


  update_table(props?: any) {

    if (props.properties.count > 0) {
      this.exceedenceProbability = Math.round(props.properties.stats * 100) / 100;
      this.selectedRegion = this.toTitleCase(props.properties.name);
      this.tweetCount = Math.round(props.properties.count * 100) / 100;
      this.embeds = this._processedTweetInfo[this._activePolys]["embed"][props.properties.name];
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = true;
      this.showTweets()
    } else {
      this.hideTweets()
    }

  };

  public resetHighlight(e: LeafletMouseEvent) {
    console.log("resetHighlight");


    this._geojson[this._activeNumber].resetStyle(e.target);
    if (this.clicked != "") {
      dohighlightFeature(this.clicked.target);
    }
  }

  zoomToFeature(e: LeafletMouseEvent) {
    console.log("zoomToFeature");
    console.log(e.target.feature.properties.name);
    this.updateSearch({"selected": e.target.feature.properties.name});
    this.displayText(e);
    this._oldClicked = this.clicked;
    this.clicked = e;
    e.target.setStyle({
                        weight:      3,
                        color:       '#FF00FF',
                        dashArray:   '',
                        fillOpacity: 0.4
                      });
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
      dohighlightFeature(layer);
      //Update the Twitter panel with the changes
      this.update_table(feature);
    }
    const exceedenceProbability = Math.round(feature.properties.stats * 100) / 100;
    const region = this.toTitleCase(feature.properties.name);
    const count = Math.round(feature.properties.count * 100) / 100;
    const text = "" +
      `<div>Region: ${region}</div>` +
      `<div>Count: ${count}</div>` +
      `<div>Exceedence: ${exceedenceProbability}</div>`;

    layer.bindTooltip(text);
    // layer.bindPopup(this.popup.makeLayerPopup(feature.properties));
    layer.on({
               mouseover: (e) => this.ngZone.run(() => mc.highlightFeature(e)),
               mouseout:  (e) => this.ngZone.run(() => mc.resetHighlight(e)),
               click:     (e) => this.ngZone.run(() => mc.zoomToFeature(e))
             });
  }


  ngOnInit() {
    this.resetLayersTimer = timer(0, 1000).subscribe(() => {
      if (this._layersAreStale) {
        this.resetLayers(false);
        this.updateTweets();
        this._layersAreStale = false;
      }
    });
  }

  ngOnDestroy() {
    this.resetLayersTimer.unsubscribe();
  }

  ///////////////////////
  //Add the polygons
  ///////////////////////
  resetLayers(clear_click) {
    console.log("resetLayers");

    for (let key in this._basemapControl["numbers"]) {

      // noinspection JSUnfilteredForInLoop
      this._numberLayers[key].clearLayers();

      // noinspection JSUnfilteredForInLoop
      this._geojson[key] = new GeoJSON(this._polygonData[this._activePolys], {
        style:         (feature) => this._colorFunctions[key].getFeatureStyle(feature),
        onEachFeature: (f, l) => this.onEachFeature(f, l)
      }).addTo(this._numberLayers[key]);

      if (clear_click) {
        console.log("resetLayers clear_click");
        if (this.clicked != "") {
          this._geojson[this._activeNumber].resetStyle(this.clicked);
        }
        this.clicked = "";
      }
    }
  }

  /////////////////////////////
  //get datafiles & init
  /////////////////////////////
  readData() {
    console.log("readData");
    this.loadLiveData()
        .then((tweet_json) => {
          console.log("loadLiveData() completed");
          this._tweetInfo = tweet_json;
          this.timeKeys = getTimes(this._tweetInfo);
          processData(this._tweetInfo, this._processedTweetInfo, this._polygonData, this.stats, this._B,
                      this.timeKeys.slice(-this._defaultMax, -this._defaultMin), this._gridSizes);
          this.initSlider();
          this._layersAreStale = true;
        }).catch((e) => {
      console.log("Loading data failed " + e);
      console.log(e);
    });

  };

  ///////////////////////////
  //Slider, start after reading JSON
  ///////////////////////////


  initSlider() {
    console.log("initSlider");
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
    this._showTweets = false;
  }

  private showTweets() {
    this._showTweets = true;
  }

  public sliderChange(range: DateRange) {
    this._defaultMax = range.upper;
    this._defaultMin = range.lower;
    this.updateSearch({min_offset: range.lower, max_offset: range.upper});
    this._layersAreStale = true;
    if (this.clicked != "") {
      this.displayText(this.clicked);
    }
  }

  private updateTweets() {
    processData(this._tweetInfo, this._processedTweetInfo, this._polygonData,
                this.stats,
                this._B, this.timeKeys.slice(-this._defaultMax, -this._defaultMin),
                this._gridSizes);
  }
}
