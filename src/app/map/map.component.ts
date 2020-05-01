import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {Auth, Logger, Storage} from 'aws-amplify';
import {
  Browser,
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
import {getColor, getFeatureStyle, LayerStyleService} from "./services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {Feature, PolygonData, Properties} from "./types";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../services/uiexecution.service";

type MapLayers = { "Local Authority": any, "Coarse Grid": any, "Fine Grid": any };
type NumberLayers = { "Exceedance": any, "Tweet Count": any }
type RegionData<R, S, T> = { stats: R; count: S; embed?: T };
type ColorFunctionObject = { getColor(), getFeatureStyle(feature: geojson.Feature<geojson.GeometryObject, any>) }
type ColorFunctions = RegionData<ColorFunctionObject, ColorFunctionObject, ColorFunctionObject>
type ColorData = RegionData<{ colors: string[], values: number[] }, { colors: string[], values: number[] }, any>;
type BasemapControl = { polygon: MapLayers; numbers: NumberLayers };

type ByRegionType<T> = {
  [index in PolygonLayerShortName]: T;
};

type PolygonLayerFullName = "Local Authority" | "Coarse Grid" | "Fine Grid";
type PolygonLayerShortName = "county" | "coarse" | "fine";
type NumberLayerShortName = "stats" | "count" ;
type NumberLayerFullName = "Exceedance" | "Tweet Count" ;
const polygonLayerFullNames: PolygonLayerFullName[] = ["Local Authority", "Coarse Grid", "Fine Grid"];
const polygonLayerShortNames: PolygonLayerShortName[] = ["county", "coarse", "fine"];
const numberLayerFullNames: NumberLayerFullName[] = ["Exceedance", "Tweet Count"];
const numberLayerShortNames: NumberLayerShortName[] = ["stats", "count"];

const regionDataKeys: string[] = ["stats", "count", "embed"];

const MAX_TWEETS = 100;
// These are provided as constants to reduce the chance of typos changing functionality
const FEATURES = "features";
const COUNT = "count";
const PROPERTIES = "properties";
const NAME = "name";
const EMBED = "embed";
const TWEETS = "tweets";
const I = "i";
const STATS = "stats";
const COUNTY = "county";
const W = "w";

//TODO: types for the data
class TimeSlice {
  [index: string]: any;

  tweets: string[];
}

const log = new Logger('map');

@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent implements OnInit, OnDestroy {


  /**
   * The unprocessed twitter data that's come in from the server
   * or null if the data has been processed.
   */
  private _rawTwitterData: TimeSlice[] | null = null;
  /**
   * This is the processed data from the server.
   *
   * @see _rawTwitterData for the unprocessed data.
   */
  private _twitterData: ByRegionType<RegionData<any, number[], string[]>> = {
    county: {stats: {}, count: [], embed: []},
    coarse: {stats: {}, count: [], embed: []},
    fine:   {stats: {}, count: [], embed: []},
  };
  /**
   * This is the semi static stats data which is loaded from assets/data.
   */
  private _stats: ByRegionType<RegionData<any, any, any>> = {
    county: {stats: {}, count: {}, embed: {}},
    coarse: {stats: {}, count: {}, embed: {}},
    fine:   {stats: {}, count: {}, embed: {}}
  };


  // The Map & Map Layers
  private _statsLayer: LayerGroup = layerGroup();
  private _countyLayer: LayerGroup = layerGroup(); //dummy layers to fool layer control
  private _map: Map;

  private _numberLayers: NumberLayers = {"Exceedance": null, "Tweet Count": null};
  private _polyLayers: MapLayers = {"Local Authority": null, "Coarse Grid": null, "Fine Grid": null};
  private _polyLayersNameMap = {"Local Authority": "county", "Coarse Grid": "coarse", "Fine Grid": "fine"};
  private _numberLayersNameMap = {"Exceedance": "stats", "Tweet Count": "count"};
  private _basemapControl: BasemapControl = {"numbers": this._numberLayers, "polygon": this._polyLayers};
  private _polygonData: ByRegionType<PolygonData | geojson.GeoJsonObject> = {
    county: fgsData,
    coarse: coarseData,
    fine:   fineData
  };
  public activeNumberLayerShortName: NumberLayerShortName = STATS;
  public activePolyLayerShortName: PolygonLayerShortName = COUNTY;
  private _geojson: { stats: GeoJSON, count: GeoJSON } = {stats: null, count: null};
  private _gridSizes: ByRegionType<string> = {county: COUNTY, coarse: "15", fine: "60"};

  private _dateMax = 0;
  private _dateMin = -24 * 60 + 1;
  private _oldClicked: (LeafletMouseEvent | "") = "";
  private _clicked: (LeafletMouseEvent | "") = "";
  public timeKeyedData: any; //The times in the input JSON
  private _lcontrols: { numbers: Control.Layers, polygon: Control.Layers } = {numbers: null, polygon: null};

  private _B: number = 1407;//countyStats["cambridgeshire"].length; //number of stats days


  // URL state management //

  /**
   * The current URL parameters, this is updated by a subscriber to this.route.queryParams.
   */
  private _params: boolean = null;
  /**
   * A subscription to the URL search parameters state.
   */
  private _searchParams: Observable<Params>;
  /**
   * The new parameters that should be merged into the existing parameters.
   */
  private _newParams: Partial<Params>;


  private _feature;

  private _loggedIn: boolean;


  // Timed action triggers //
  private _layersAreStale: boolean;
  private _stateIsStale: boolean;
  private _twitterIsStale: boolean;

  // Timers for timed actions //
  private _resetLayersTimer: Subscription;
  private _stateUpdateTimer: Subscription;
  private _twitterUpdateTimer: Subscription;
  private _loadTimer: Subscription;


  //The UI state fields
  public embeds: string;
  public selectedRegion: string;
  public exceedanceProbability: number;
  public tweetCount: number;
  public tweetsVisible: boolean = false;
  public twitterPanelHeader: boolean;
  public loading: boolean = false;
  public ready: boolean = false;
  public sliderOptions: DateRangeSliderOptions = {
    max:      0,
    min:      this._dateMin,
    startMin: this._dateMin,
    startMax: this._dateMax
  };

  public colorData: ColorData = {
    stats: {values: [5, 2.5, 1, 0.5], colors: ['#FEE5D9', '#FCAE91', '#FB6A4A', '#DE2D26', '#A50F15']},
    count: {values: [150, 50, 20, 10], colors: ['#045A8D', '#2B8CBE', '#74A9CF', '#BDC9E1', '#F1EEF6']}
  };

  public colorFunctions: ColorFunctions = {stats: null, count: null};
  public showTwitterTimeline: boolean;


  public options: any = {
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

  /**
   * A flag that prevents more than one simultaneous update to the map.
   */
  private _updating: boolean;
  private _selectedFeatureName: string;


  constructor(private _router: Router, private route: ActivatedRoute, private ngZone: NgZone,
              private _layerStyles: LayerStyleService,
              private _notify: NotificationService,
              private _auth: AuthService,
              private _http: HttpClient,
              private _exec: UIExecutionService
  ) {
    //save the query parameter observable
    this._searchParams = this.route.queryParams;

    // Preload the cacheable stats files asynchronously
    // this gets called again in onMapReady()
    // But the values should be in the browser cache by then
    this.loadStats().then(() => {log.debug("Prefetched the stats files.")});
  }

  /**
   * Called when the map element has finished initialising.
   * @param map
   */
  onMapReady(map: Map) {
    log.debug("onMapReady");

    this._map = map;
    this.loadStats()
        .then(() => this.init(map))
        .catch(err => {
          // this._notify.show("Error while loading map data");
          log.warn(err);
        });
  }

  /**
   * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
   */
  private loadStats(): Promise<any> {
    log.debug("loadStats()");
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
   * This is called to change the value of the URL query using pushState.
   * In fact it mearly marks the URL state as stale and records the new
   * value to assign to the URL query.
   *
   * @param params the parameter values to merge into the current URL.
   */
  updateSearch(params: Partial<Params>) {
    log.debug("updateSearch(", params, ")");

    // Merge the params to change into _newParams which holds the
    // next set of parameters to add to the URL state.
    this._newParams = {...this._newParams, ...params};
    this._exec.queue("Update URL Query Params", ["ready"], () => {
      this._router.navigate([], {
        queryParams:         this._newParams,
        queryParamsHandling: 'merge'
      });
    })

  }

  /**
   * Update the map from the query parameters.
   *
   * @param params the new value for the query parameters.
   */
  private updateMapFromQueryParams(params: Params) {
    log.debug("updateMapFromQueryParams()");
    log.debug("Params:", params);
    const {lng, lat, zoom, active_number, active_polygon, selected, min_offset, max_offset} = params;

    // These handle the date slider min_offset & max_offset values
    if (typeof min_offset !== "undefined") {
      this.sliderOptions.startMin = min_offset;
      this._dateMin = min_offset;
    }
    if (typeof max_offset !== "undefined") {
      this._dateMax = max_offset;
      this.sliderOptions.startMax = max_offset;
    }

    // This handles the fact that the zoom and lat/lng can change independently of each other
    let newCentre = this._map.getCenter();
    let newZoom = this._map.getZoom();
    let viewChange = false;
    if (typeof lat !== "undefined" && typeof lng !== "undefined") {
      viewChange = latLng(lat, lng) !== newCentre;
      newCentre = latLng(lat, lng);
    }
    if (typeof zoom !== "undefined") {
      viewChange = newZoom != zoom || viewChange;
      newZoom = zoom;
    }
    if (viewChange) {
      this._map.setView(newCentre, newZoom);
    }

    // if (typeof active_polys != "undefined") {
    //   this.options.zoom = zoom;
    // }

    // This handles a change to the active_number value
    const numberLayerName: NumberLayerShortName = typeof active_number !== "undefined" ? active_number : STATS;
    this.activeNumberLayerShortName = numberLayerName;

    if (this._map) {
      for (let layer in this._numberLayers) {
        if (this._numberLayersNameMap[layer] !== numberLayerName) {
          log.debug("Removing " + layer);
          this._map.removeLayer(this._numberLayers[layer]);
        }
        this.activeNumberLayerShortName = numberLayerName;
      }
      for (let layer in this._numberLayers) {
        if (this._numberLayersNameMap[layer] === numberLayerName) {
          log.debug("Adding " + layer);
          this._map.addLayer(this._numberLayers[layer]);

        }
      }
    }

    // This handles a change to the active_polygon value
    const polygonLayerName: PolygonLayerShortName = typeof active_polygon !== "undefined" ? active_polygon : COUNTY;
    this.activePolyLayerShortName = polygonLayerName;

    if (this._map) {
      for (let layer in this._polyLayers) {
        if (this._polyLayersNameMap[layer] !== polygonLayerName) {
          log.debug("Removing " + layer);
          this._map.removeLayer(this._polyLayers[layer]);
        }
      }
      for (let layer in this._polyLayers) {
        if (this._polyLayersNameMap[layer] === polygonLayerName) {
          log.debug("Adding " + layer);
          this._map.addLayer(this._polyLayers[layer]);

        }
      }
    }

    // If a polygon (region) is selected update Twitter panel.
    if (typeof selected !== "undefined") {
      this._selectedFeatureName = selected;
      this._twitterIsStale;
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
  private async loadLiveData(): Promise<TimeSlice[]> {
    log.debug("loadLiveData()");
    return <Promise<TimeSlice[]>>Storage.get("live.json")
                                        .then((url: any) => this._http.get(url.toString(),
                                                                           {observe: "body", responseType: "json"})
                                                                .toPromise());
  }


  /**
   * This method does all the heavy lifting and is called when
   * the map is ready and data is loaded.
   * @param map the leaflet.js Map
   */
  private async init(map: Map) {
    log.debug("init");


    //define the layers for the different counts
    this._numberLayers["Exceedance"] = layerGroup().addTo(map);
    this._numberLayers["Tweet Count"] = layerGroup();

    //layers for the different polygons
    this._polyLayers["Local Authority"] = layerGroup().addTo(map);
    this._polyLayers["Coarse Grid"] = layerGroup();
    this._polyLayers["Fine Grid"] = layerGroup();


    // Set up the color functions for the legend
    const newColorFunctions: ColorFunctions = {stats: null, count: null};
    for (let key of numberLayerShortNames) {
      newColorFunctions[key] = {
        getColor:        getColor.bind(newColorFunctions[key], this.colorData[key].values,
                                       this.colorData[key].colors),
        getFeatureStyle: getFeatureStyle.bind(newColorFunctions[key], this.colorData[key].values,
                                              this.colorData[key].colors,
                                              key)
      };
    }
    //This assignment triggers the change to the legend
    this.colorFunctions = newColorFunctions;


    this.setupCountStatsToggle();

    this._loggedIn = await Auth.currentAuthenticatedUser() != null;

    this._exec.state("map-init");


    await this.load();
    this._searchParams.subscribe(params => {
      if (!this._params) {
        this._exec.queue("Initial Search Params", ["ready", "no-params"],
                         () => {
                           this._params = true;

                           this.updateMapFromQueryParams(params);
                           //Listeners to push map state into URL
                           map.addEventListener("dragend", () => {
                             return this.ngZone.run(
                               () => this.updateSearch(
                                 {lat: this._map.getCenter().lat, lng: this._map.getCenter().lng}))
                           });

                           map.addEventListener("zoomend", (event) => {
                             return this.ngZone.run(() => this.updateSearch({zoom: this._map.getZoom()}));
                           });

                           map.on('baselayerchange', (e: any) => {
                             log.debug("New baselayer " + e.name);
                             if (e.name in this._basemapControl.polygon) {
                               this.activePolyLayerShortName = this._polyLayersNameMap[e.name];
                               this.updateSearch({active_polygon: this.activePolyLayerShortName, selected: null});
                               this._exec.queue("Reset Layers", ["ready", "data-loaded"], () => {
                                 this.resetLayers(true);
                               });
                             } else {
                               this.activeNumberLayerShortName = this._numberLayersNameMap[e.name];
                               this.updateSearch({active_number: this.activeNumberLayerShortName});
                             }
                           });
                           this._exec.state("ready");
                           return this.updateLayers().then(()=>this._twitterIsStale = true);

                         });
      }

    });


    // Schedule periodic data loads from the server
    this._loadTimer = timer(60000, 60000).subscribe(() => this.load());
  }

  private setupCountStatsToggle() {
    log.debug("setupCountStatsToggle()");
    for (let key in this._basemapControl) {
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key] = control.layers(this._basemapControl[key], {}).addTo(this._map);
      // noinspection JSUnfilteredForInLoop
      this._lcontrols[key].setPosition('topleft');
    }

  }


  /**
   * When the user places their mouse over a feature (region) this is called.
   * @param e
   */
  featureEntered(e: LeafletMouseEvent) {
    log.debug("featureEntered()");
    const feature = e.target.feature;
    const exceedanceProbability: number = Math.round(feature.properties.stats * 100) / 100;
    const region: string = this.toTitleCase(feature.properties.name);
    const count: number = feature.properties.count;
    this.highlight(e, 1);

    let text = "" +
      `<div>Region: ${region}</div>`;
    if (count > 0) {
      text = text +
        `<div>Count: ${count}</div>`;
      if ("" + exceedanceProbability != "NaN") {
        text = text + `<div>Exceedance: ${exceedanceProbability}</div>`;
      }
    }

    e.target.bindTooltip(text).openTooltip();
  }

  private highlight(e: LeafletMouseEvent, weight: number = 3) {
    const feature = e.target.feature;
    const count: number = feature.properties.count;
    e.target.setStyle({
                        stroke:      true,
                        weight,
                        color:       '#EA1E63',
                        dashArray:   '',
                        fillOpacity: count > 0 ? 1.0 : 0.0,
                        fill:        count > 0
                      });

    if (!Browser.ie && !Browser.opera && !Browser.edge) {
      e.target.bringToFront();
    }
  }

  /**
   * Update the Twitter panel by updating the properties it reacts to.
   * @param props
   */
  updateTwitterPanel(props?: any) {
    log.debug("updateTwitterPanel()");
    this.selectedRegion = this.toTitleCase(props.properties.name);
    if (props.properties.count > 0) {
      log.debug("updateTwitterHeader()");
      this.exceedanceProbability = Math.round(props.properties.stats * 100) / 100;
      this.tweetCount = props.properties.count;
      this.embeds = this._twitterData[this.activePolyLayerShortName].embed[props.properties.name];
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = true;
      // Hub.dispatch("twitter-panel",{message:"update",event:"update"});
      this.showTweets()
    } else {
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = false;
      this.tweetCount = 0;
      this.exceedanceProbability = 0;
      this.embeds = "";

    }

  };

  /**
   * Mouse out event.
   * @param e
   */
  featureLeft(e: LeafletMouseEvent) {
    log.debug("featureLeft(" + this.activeNumberLayerShortName + ")");
    this._geojson[this.activeNumberLayerShortName].resetStyle(e.propagatedFrom);
    if (this._clicked != "") {
      this.highlight(this._clicked);
    }
  }

  /**
   * Mouse click event.
   * @param e
   */
  featureClicked(e: LeafletMouseEvent) {
    log.debug("featureClicked()");
    log.debug(e.target.feature.properties.name);
    this._selectedFeatureName = e.target.feature.properties.name;
    this.updateSearch({selected: e.target.feature.properties.name});
    this.updateTwitterPanel(e.target.feature);
    this._oldClicked = this._clicked;
    this._clicked = e;
    this.highlight(e, 3);
    if (this._oldClicked != "") {
      this.featureLeft(this._oldClicked);
    }
  }

  /**
   * Converts a lower case string to a Title Case String.
   *
   * @param str the lowercase string
   * @returns a Title Case String
   */
  toTitleCase(str: string): string {
    return str.replace(/\S+/g, str => str.charAt(0).toUpperCase() + str.substr(1).toLowerCase());
  }

  onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: GeoJSON) {
    log.verbose("onEachFeature()");

    // If this feature is referenced in the URL query paramter selected
    // e.g. ?...&selected=powys
    // then highlight it and update Twitter
    if (feature.properties.name === this._selectedFeatureName) {
      log.debug("Matched " + feature.properties.name);

      //Put the selection outline around the feature
      layer.setStyle({
                       stroke:      true,
                       weight:      3,
                       color:       '#EA1E63',
                       dashArray:   '',
                       fillOpacity: feature.properties.count > 0 ? 1.0 : 0.0
                     });

      if (!Browser.ie && !Browser.opera && !Browser.edge) {
        layer.bringToFront();
      }

      //Update the Twitter panel with the changes
      this._feature = feature;
      this.showTweets();
    }

    //this.ngZone.run(...) is called because the event handler takes place outside of angular.
    //But we need all of angulars property change detection etc. to happen.
    const mc = this;
    layer.on({
               mouseover: (e) => this.ngZone.run(() => mc.featureEntered(e)),
               mouseout:  (e) => this.ngZone.run(() => mc.featureLeft(e)),
               click:     (e) => this.ngZone.run(() => mc.featureClicked(e))
             });
  }


  ngOnInit() {
    // Because of the impact on the user experience we prevent overlapping events from occurring
    // and throttle those events also. The prevention of overlapping events is done by the use
    // of a flag and queued events. The throttling is acheived by the the periodicity of the
    // schedulers execution.

    this._exec.start();


    this._twitterUpdateTimer = timer(0, 2000).subscribe(() => {
      if (this._twitterIsStale) {
        this.updateTwitter();
        this._twitterIsStale = false;
      }
    });

    this._auth.authState.subscribe((event: string) => {
      if (event === AuthService.SIGN_IN) {
        this._loggedIn = true;
      }
      if (event === AuthService.SIGN_OUT) {
        this._loggedIn = false;
      }
    });

  }

  /**
   * Clear up when the component is destroyed.
   */
  ngOnDestroy() {
    if (this._loadTimer) {
      this._loadTimer.unsubscribe();
    }
    if (this._twitterUpdateTimer) {
      this._twitterUpdateTimer.unsubscribe();
    }
  }

  /**
   * Reset the polygon layers.
   *
   * @param clear_click clears the selected polygon
   */
  resetLayers(clear_click) {
    log.debug("resetLayers(" + clear_click + ")");
    this.ready = false
    this.hideTweets();
    for (let key of numberLayerFullNames) {
      log.debug(key);
      const layerGroup = this._numberLayers[key];
      if (layerGroup != null) {
        // noinspection JSUnfilteredForInLoop
        layerGroup.clearLayers();

        // noinspection JSUnfilteredForInLoop
        const shortNumberLayerName = this.shortNumberLayerName(key);
        this._geojson[shortNumberLayerName] = new GeoJSON(
          <geojson.GeoJsonObject>this._polygonData[this.activePolyLayerShortName], {
            style:         (feature) => this.colorFunctions[shortNumberLayerName].getFeatureStyle(feature),
            onEachFeature: (f, l) => this.onEachFeature(f, <GeoJSON>l)
          }).addTo(layerGroup);
      } else {
        log.debug("Null layer " + key);
      }
      if (clear_click) {
        log.debug("resetLayers() clear_click");
        if (this._clicked != "") {
          this._geojson[this.activeNumberLayerShortName].resetStyle(this._clicked.layer);
        }
        this._clicked = "";
        this._feature = null;
      }
    }
    this.ready = true;
  }

  private shortNumberLayerName(key: NumberLayerFullName): NumberLayerShortName {
    return <NumberLayerShortName>this._numberLayersNameMap[key];
  }

  /**
   * Read the live.json data file and process contents.
   */
  async load() {
    log.debug("load()");
    this.loading = true;
    try {

      await this._exec.queue("Load Data", ["ready", "map-init", "data-loaded", "data-load-failed"], () => {
        return this.loadLiveData().then(i => {
          this._rawTwitterData = i;
          this._exec.state("data-loaded");
          log.debug("Loading live data completed");
        }).catch(e => {
          log.error(e);
        });
      });

      await this._exec.queue("Update Slider", ["ready", "data-loaded"],
                             () => {this.updateSliderFromData(this._rawTwitterData);});

      await this.updateLayers();

      this._twitterIsStale = true;


    } catch (e) {
      this._exec.state("data-load-failed");
      setTimeout(() => {
        this.ngZone.run(() => this.load())
      }, 5000);
      log.error(e);
      this.loading = false;
      this.ready = false;
    }

  }


  private async updateLayers() {
    return this._exec.queue("Update Layers", ["ready", "data-loaded"], () => {
                             // Mark as stale to trigger a refresh
                             this._exec.state("data-refresh");
                             this.updateData(this._rawTwitterData);
                             this.resetLayers(false);
                             if (this._params) {
                               this._exec.state("ready");
                             } else {
                               this._exec.state("no-params");
                             }
                             this.ready = true;
                             this.loading = false;
                           }
    );
  }

  /**
   *
   * @param place
   * @param val
   * @param poly
   * @param B
   * @param statsData
   */
  getStatsIdx(place, val, poly, B, statsData) {
    for (let i = 0; i < B; i++) {
      if (val <= statsData[poly][place][i]) {
        return i;
      }
    }
    return B;
  }

  /**
   * @returns reverse sorted time keys from the data
   */
  getTimes(data: TimeSlice[]) {
    const time_keys = Object.keys(data);
    time_keys.sort();
    time_keys.reverse();
    return time_keys;
  }

  /**
   * This updates the map features and the {@link _twitterData} field
   * with incoming data from the server.
   *
   * @param tweetInfo the data from the server.
   */
  private updateData(tweetInfo: TimeSlice[]) {
    log.debug("update()")
    if (this._updating) {
      log.debug("Update already running.")
      return;
    }
    this._updating = true;

    log.debug("Updating data");
    this.timeKeyedData = this.getTimes(tweetInfo);
    // For performance reasons we need to do the
    // next part without triggering Angular
    try {
      this.ngZone.runOutsideAngular(() => {
        this.clearMapFeatures();
        this.clearProcessedTweetData();

        this.updateTweetsData(tweetInfo);
        this.updateRegionData();
      });
    } finally {
      log.debug("update() end");
      this._updating = false;
    }
    // if (this._clicked != "") {
    //   this.updateTwitterHeader(this._clicked.target.feature);
    // }
  }

  /**
   * Clears down the {@link _twitterData} field.
   */
  private clearProcessedTweetData() {
    for (const k in this._twitterData) {
      if (this._twitterData.hasOwnProperty(k)) {
        for (const p in (this._twitterData)[k as PolygonLayerShortName]) {
          (this._twitterData)[k as PolygonLayerShortName][p] = {};
        }
      }
    }
  }

  /**
   * Clears and initialises feature data on the map.
   */
  private clearMapFeatures() {
    for (const regionType in this._twitterData) { //counties, coarse, fine
      if (this._twitterData.hasOwnProperty(regionType)) {
        const features = (<PolygonData>this._polygonData[regionType as PolygonLayerShortName]).features;
        for (let i = 0; i < features.length; i++) {
          const properties = features[i].properties;
          const place = properties.name;
          if (place in (this._twitterData)[regionType as PolygonLayerShortName].count) {
            properties[COUNT] = 0;
            properties[STATS] = 0;
          }
        }
      } else {
        log.debug("Skipping " + regionType)
      }
    }
  }

  /**
   * Updates the {@link _twitterData} field to contain a processed
   * version of the incoming TimeSlice[] data.
   *
   * @param tweetInfo the raw data to process.
   */
  private updateTweetsData(tweetInfo: TimeSlice[]) {

    const {_dateMin, _dateMax, _gridSizes, _twitterData, timeKeyedData} = this;

    for (const i in timeKeyedData.slice(-_dateMax, -_dateMin)) { //all times
      var timeKey = (timeKeyedData.slice(-_dateMax, -_dateMin))[i];
      for (const regionType in _twitterData) { //counties, coarse, fine
        console.assert(polygonLayerShortNames.includes(regionType as PolygonLayerShortName));
        if (_twitterData.hasOwnProperty(regionType)) {
          const timeslicedData: TimeSlice = (tweetInfo)[timeKey];
          for (const place in timeslicedData[(_gridSizes)[regionType]]) { //all counties/boxes
            if (timeslicedData[(_gridSizes)[regionType]].hasOwnProperty(place)) {
              //add the counts
              const wt = timeslicedData[(_gridSizes)[regionType]][place][W];
              const tweetsByPolygon: RegionData<any, number[], string[]> = (_twitterData)[regionType];
              if (place in tweetsByPolygon.count) {
                tweetsByPolygon.count[place] += wt;
              } else {
                tweetsByPolygon.count[place] = wt;
                tweetsByPolygon.embed[place] = ""
              }
              for (const i in timeslicedData[_gridSizes[regionType]][place][I]) {
                const tweetcode_id = timeslicedData[(_gridSizes)[regionType]][place][I][i];
                const tweetcode: string = timeslicedData.tweets[tweetcode_id]; //html of the tweet
                if (tweetcode != "" && tweetsByPolygon.count[place] < MAX_TWEETS) {
                  tweetsByPolygon.embed[place] += "<tr><td>" + tweetcode + "</td></tr>"
                }
              }
            } else {
              log.debug("Skipping " + place);
            }
          }
        } else {
          log.debug("Skipping " + regionType);
        }
      }
    }
  }

  /**
   * Updates the data stored in the polygon data of the leaflet layers.
   */
  private updateRegionData() {
    const {_stats, _dateMin, _polygonData, _dateMax, _B, _twitterData, timeKeyedData} = this;
    var tdiff = timeKeyedData.slice(-_dateMax, -_dateMin).length / 1440;
    for (const regionType in _twitterData) { //counties, coarse, fine
      if (_twitterData.hasOwnProperty(regionType)) {
        console.assert(polygonLayerShortNames.includes(regionType as PolygonLayerShortName));
        const regionData: PolygonData = <PolygonData>(_polygonData)[regionType as PolygonLayerShortName];
        const features: Feature[] = regionData.features;
        for (let i = 0; i < features.length; i++) {
          const featureProperties: Properties = features[i].properties;
          const place = featureProperties.name;
          const tweetRegionInfo: RegionData<any, number[], string[]> = _twitterData[regionType as PolygonLayerShortName];
          if (place in tweetRegionInfo.count) {
            const wt = tweetRegionInfo.count[place];
            let stats_wt = 0;
            if (wt) {
              var as_day = wt / tdiff; //average # tweets per day arraiving at a constant rate
              stats_wt = this.getStatsIdx(place, as_day, regionType, _B, _stats); //number of days with fewer tweets
              //exceedance probability = rank / (#days + 1) = p
              //rank(t) = #days - #days_with_less_than(t)
              //prob no events in N days = (1-p)^N
              //prob event in N days = 1 - (1-p)^N
              stats_wt = 100 * (1 - Math.pow(1 - ((_B + 1 - stats_wt) / (_B + 1)), tdiff));
            }

            tweetRegionInfo[place] = stats_wt;
            featureProperties.count = wt;
            //TODO: This seems to be a bug. Need to check if intentional
            featureProperties[STATS] = stats_wt;
          }
        }
      }
    }
  }

  /**
   * Update the date slider after a data update.
   */
  updateSliderFromData(data: TimeSlice[]) {
    log.debug("updateSliderFromData()");
    this.timeKeyedData = this.getTimes(data);
    log.info("Latest data is dated at: " + this.timeKeyedData[this.timeKeyedData.length - 1])
    this._dateMin = Math.max(this._dateMin, -(this.timeKeyedData.length - 1));
    this.sliderOptions = {
      max:      0,
      min:      -this.timeKeyedData.length + 1,
      startMin: this._dateMin,
      startMax: this._dateMax
    };

  }

  /**
   * Hides the tweet drawer/panel.
   */
  private hideTweets() {
    log.debug("hideTweets()");
    this.tweetsVisible = false;
  }

  /**
   * Reveals the tweet drawer/panel.
   */
  private showTweets() {
    log.debug("showTweets()");
    this.tweetsVisible = true;
  }

  /**
   * Triggered by a change to the date range slider.
   *
   * @see DateRangeSliderComponent
   * @param range the user selected upper and lower date range.
   */
  public sliderChange(range: DateRange) {
    const {lower, upper} = range;
    log.info("sliderChange(" + lower + "->" + upper + ")");
    this._dateMax = upper;
    this._dateMin = lower;
    this.updateSearch({min_offset: lower, max_offset: upper});
    this._exec.queue("Update Layers from Slider Change", ["data-loaded", "ready"], () => {
                       // Mark as stale to trigger a refresh
                       this._twitterIsStale = true;
                       this.updateData(this._rawTwitterData);
                       this.resetLayers(false);
                     }
    );


  }

  /**
   * Triggered when the user has finished sliding the slider.
   * @param $event
   */
  public sliderChangeOnEnd($event: any) {
    log.debug("sliderChangeOnEnd()");
    this._twitterIsStale = true;
  }

  /**
   * Update the twitter panel using the currently selected feature.
   *
   */
  private updateTwitter() {
    log.debug("updateTwitter()");
    this._exec.queue("Update Twitter", ["ready"], () => {
      // Mark as stale to trigger a refresh
      if (!this.tweetsVisible) {
        this._clicked = "";
        this._feature = null;
      }
      if (this._clicked != "") {
        this.updateTwitterPanel(this._clicked.target.feature);
      } else if (this._feature) {
        this.updateTwitterPanel(this._feature);
      }
    });


  }
}
