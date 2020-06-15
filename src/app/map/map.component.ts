import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {fgsData} from './county_bi';
import {coarseData} from './coarse_bi';
import {fineData} from './fine_bi';
import {Auth, Logger} from 'aws-amplify';
import {
  Browser,
  control,
  Control,
  GeoJSON,
  latLng,
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
import {LayerStyleService} from "./services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {
  BasemapControl,
  ByRegionType,
  COUNTY,
  Feature,
  Geometry,
  MapLayers,
  NumberLayerFullName,
  numberLayerFullNames,
  NumberLayers,
  NumberLayerShortName,
  PolygonData,
  PolygonLayerShortName,
  polygonLayerShortNames,
  Properties,
  STATS
} from "./types";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {DUPLICATE_REASON, UIExecutionService, UIState} from "../services/uiexecution.service";
import {ColorCodeService} from "./services/color-code.service";
import {MapDataService} from "./data/map-data.service";
import {ProcessedPolygonData} from "./data/processed-data";
import {Tweet} from "./twitter/tweet";


const log = new Logger('map');

@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent implements OnInit, OnDestroy {


  // The Map & Map Layers
  private _statsLayer: LayerGroup = layerGroup();
  private _countyLayer: LayerGroup = layerGroup(); //dummy layers to fool layer control
  private _map: Map;

  private _numberLayers: NumberLayers = {"Exceedance": null, "Tweet Count": null};
  private _polyLayers: MapLayers = {"Local Authority": null, "Coarse Grid": null, "Fine Grid": null};
  private _polyLayersNameMap = {"Local Authority": "county", "Coarse Grid": "coarse", "Fine Grid": "fine"};
  private _numberLayersNameMap = {"Exceedance": "stats", "Tweet Count": "count"};
  private _basemapControl: BasemapControl = {"numbers": this._numberLayers, "polygon": this._polyLayers};

  public activeNumberLayerShortName: NumberLayerShortName = STATS;
  public activePolyLayerShortName: PolygonLayerShortName = COUNTY;


  private _oldClicked: (LeafletMouseEvent | "") = "";
  private _clicked: (LeafletMouseEvent | "") = "";
  private _lcontrols: { numbers: Control.Layers, polygon: Control.Layers } = {numbers: null, polygon: null};
  private _geojson: { stats: GeoJSON, count: GeoJSON } = {stats: null, count: null};


  // URL state management //

  // ... URL parameters
  private _dateMax = 0;
  private _dateMin = -24 * 60 + 1;
  private _absoluteTime: number;
  private _previousDateMin: string;
  private _previousDateMax: any;

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

  //The UI state fields
  public tweets: Tweet[] = null;
  public selectedRegion: string;
  public selectedGeometry: Geometry;
  public exceedanceProbability: number;
  public tweetCount: number;
  public tweetsVisible: boolean = false;
  public twitterPanelHeader: boolean;
  public activity: boolean = false;
  public ready: boolean = false;
  public sliderOptions: DateRangeSliderOptions = {
    max:      0,
    min:      this._dateMin,
    startMin: this._dateMin,
    startMax: this._dateMax
  };


  private _feature;

  private _loggedIn: boolean;


  // Timed action triggers //
  private _twitterIsStale: boolean;

  // Timers for timed actions //
  private _twitterUpdateTimer: Subscription;
  private _loadTimer: Subscription;


  public showTwitterTimeline: boolean;
  private _selectedFeatureName: string;
  private _updating: boolean;
  private _stateSub: Subscription;


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
  private readonly MINIMUM_DATE: number = 24 * 60 * 60 * 7;
  private _absoluteDateUpdateTimer: Subscription;



  constructor(private _router: Router,
              private route: ActivatedRoute,
              private _zone: NgZone,
              private _layerStyles: LayerStyleService,
              private _notify: NotificationService,
              private _auth: AuthService,
              private _http: HttpClient,
              private _exec: UIExecutionService,
              private _color: ColorCodeService,
              private _data: MapDataService
  ) {
    //save the query parameter observable
    this._searchParams = this.route.queryParams;

    // Preload the cacheable stats files asynchronously
    // this gets called again in onMapReady()
    // But the values should be in the browser cache by then
    this._data.loadStats().then(() => {log.debug("Prefetched the stats files.")});
  }

  /**
   * Called when the map element has finished initialising.
   * @param map
   */
  onMapReady(map: Map) {
    log.debug("onMapReady");

    this._map = map;
    this._data.loadStats()
        .then(() => this.init(map))
        .catch(err => {
          // this._notify.show("Error while loading map data");
          log.warn(err);
        });
  }


  /**
   * This is called to change the value of the URL query using pushState.
   * In fact it mearly marks the URL state as stale and records the new
   * value to assign to the URL query.
   *
   * @param params the parameter values to merge into the current URL.
   */
  async updateSearch(params: Partial<Params>) {
    log.debug("updateSearch(", params, ")");

    // Merge the params to change into _newParams which holds the
    // next set of parameters to add to the URL state.
    return this._exec.queue("Update URL Query Params", ["ready", "data-refresh"], async () => {
      this._newParams = {...this._newParams, ...params};
      await this._router.navigate([], {
        queryParams:         this._newParams,
        queryParamsHandling: 'merge'
      });
    }, JSON.stringify(params), false, true)

  }

  /**
   * Update the map from the query parameters.
   *
   * @param params the new value for the query parameters.
   */
  private updateMapFromQueryParams(params: Params) {
    log.debug("updateMapFromQueryParams()");
    log.debug("Params:", params);
    const {
      lng, lat, zoom, active_number, active_polygon, selected, min_offset, max_offset,
      abs_time
    } = params;

    // These handle the date slider min_offset & max_offset values
    if (typeof min_offset !== "undefined") {
      this.sliderOptions = {...this.sliderOptions, startMin: min_offset};
      this._dateMin = min_offset;
    }
    if (typeof max_offset !== "undefined") {
      this._dateMax = max_offset;
      this.sliderOptions = {...this.sliderOptions, startMax: max_offset};
    }

    // This handles the absolute time parameter used to preserve temporal state
    if (typeof abs_time !== "undefined") {
      const dateOffset = (this._data.lastEntryDate().getTime() - abs_time) / (60 * 1000);
      if (dateOffset > this._data.entryCount() - 1) {
        log.debug(abs_time, dateOffset, -this.sliderOptions.min, new Date(
          +abs_time))
        this._notify.show(`The data is no longer available for the date (${new Date(
          +abs_time)}, showing date range for current data instead.`);
      } else if (dateOffset < 0) {
        this._notify.show(`The date stored in the URL  (${new Date(
          +abs_time)} is in the future, showing date range for current time instead.`);
      } else {
        const minLimit = -(this._data.entryCount() - 1);
        this._dateMin = Math.max(minLimit, this._dateMin - dateOffset);
        this._dateMax = Math.max(minLimit, this._dateMax - dateOffset);
        log.debug(`URL Date was  (${new Date(
          +abs_time)} current Date is ${this._data.lastEntryDate()} delta was ${dateOffset} mins and minLimit is ${minLimit}.`);
        this.sliderOptions = {
          ...this.sliderOptions,
          min:      -(this._data.entryCount() - 1),
          startMin: this._dateMin,
          startMax: this._dateMax
        };
      }
      this._absoluteTime = this._data.lastEntryDate().getTime();

    } else {
      this._absoluteTime = this._data.lastEntryDate().getTime();
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
    }

    return undefined;
  }


  /**
   * This method does all the heavy lifting and is called when
   * the map is ready and data is loaded.
   * @param map the leaflet.js Map
   */
  private async init(map: Map) {
    log.debug("init");
    const zoomControl = map.zoomControl.remove();

    //define the layers for the different counts
    this._numberLayers["Exceedance"] = layerGroup().addTo(map);
    this._numberLayers["Tweet Count"] = layerGroup();

    //layers for the different polygons
    this._polyLayers["Local Authority"] = layerGroup().addTo(map);
    this._polyLayers["Coarse Grid"] = layerGroup();
    this._polyLayers["Fine Grid"] = layerGroup();


    this._loggedIn = await Auth.currentAuthenticatedUser() != null;

    this._exec.changeState("map-init");


    await this.load(true);
    this._searchParams.subscribe(params => {
      if (!this._params) {
        this._params = true;
        this._exec.queue("Initial Search Params", ["no-params"],
                         async () => {
                           this.updateMapFromQueryParams(params);
                           //Listeners to push map state into URL
                           map.addEventListener("dragend", () => {
                             return this._zone.run(
                               () => this.updateSearch(
                                 {lat: this._map.getCenter().lat, lng: this._map.getCenter().lng}))
                           });

                           map.addEventListener("zoomend", (event) => {
                             return this._zone.run(() => this.updateSearch({zoom: this._map.getZoom()}));
                           });

                           map.on('baselayerchange', async (e: any) => {
                             this._zone.run(async () => {
                               log.debug("New baselayer " + e.name);
                               if (e.name in this._basemapControl.polygon) {
                                 this.activePolyLayerShortName = this._polyLayersNameMap[e.name];
                                 this.updateSearch(
                                   {active_polygon: this.activePolyLayerShortName, selected: null});
                                 this._exec.queue("Reset Layers", ["ready", "data-loaded"], () => {
                                   this.activity = true;
                                   this.resetLayers(true);
                                   this.activity = false;
                                 });
                               } else {
                                 this.activeNumberLayerShortName = this._numberLayersNameMap[e.name];
                                 this.updateSearch({active_number: this.activeNumberLayerShortName});
                               }
                             });
                           });
                           this._exec.changeState("ready");
                           this.updateSearch({
                                               abs_time:   this._absoluteTime,
                                               min_offset: Math.round(this._dateMin),
                                               max_offset: Math.round(this._dateMax)
                                             });
                           map.addControl(zoomControl);
                           this.addToggleControls();
                           return this.updateLayers("From Parameters").then(() => this._twitterIsStale = true);

                         });
      }

    });


    // Schedule periodic data loads from the server
    this._loadTimer = timer(60000, 60000).subscribe(() => this.load());
  }

  private addToggleControls() {
    log.debug("addToggleControls()");
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
                        fillOpacity: count > 0 ? 1.0 : 0.5,
                      });

    if (!Browser.ie && !Browser.opera && !Browser.edge) {
      e.target.bringToFront();
    }
  }

  /**
   * Update the Twitter panel by updating the properties it reacts to.
   * @param feature
   */
  updateTwitterPanel(feature?: Feature) {
    log.debug(`updateTwitterPanel(${JSON.stringify(feature.properties)})`);
    this.selectedRegion = this.toTitleCase(feature.properties.name);
    this.selectedGeometry = feature.geometry;
    if (feature.properties.count > 0) {
      log.debug("Count > 0");
      this.exceedanceProbability = Math.round(feature.properties.stats * 100) / 100;
      this.tweetCount = feature.properties.count;
      log.debug(`this.activePolyLayerShortName=${this.activePolyLayerShortName}`);
      this.tweets = this._data.tweets(this.activePolyLayerShortName, feature.properties.name);
      log.debug(this.tweets);
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = true;
      // Hub.dispatch("twitter-panel",{message:"update",event:"update"});
      this.showTweets()
    } else {
      log.debug(`Count == ${feature.properties.count}`);
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = false;
      this.tweetCount = 0;
      this.exceedanceProbability = 0;
      this.tweets = [];

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
                       fillOpacity: feature.properties.count > 0 ? 1.0 : 0.01
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
               mouseover: (e) => this._zone.run(() => mc.featureEntered(e)),
               mouseout:  (e) => this._zone.run(() => mc.featureLeft(e)),
               click:     (e) => this._zone.run(() => mc.featureClicked(e))
             });
  }


  ngOnInit() {
    // Because of the impact on the user experience we prevent overlapping events from occurring
    // and throttle those events also. The prevention of overlapping events is done by the use
    // of a flag and queued events. The throttling is acheived by the the periodicity of the
    // schedulers execution.

    this._exec.start();

    this._stateSub = this._exec.state.subscribe((state: UIState) => {
      if (state === "ready") {
        this.ready = true;
      }
    });
    this._twitterUpdateTimer = timer(0, 500).subscribe(async () => {
      if (this._twitterIsStale) {
        await this.updateTwitter();
        this._twitterIsStale = false;
      }
    });

    this._auth.state.subscribe((event: string) => {
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
    if (this._stateSub) {
      this._stateSub.unsubscribe();
    }
  }

  /**
   * Reset the polygon layers.
   *
   * @param clear_click clears the selected polygon
   */
  resetLayers(clear_click) {
    log.debug("resetLayers(" + clear_click + ")");
    // this.hideTweets();
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
            style:         (feature) => this._color.colorFunctions[shortNumberLayerName].getFeatureStyle(feature),
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
  }

  /**
   * Clears and initialises feature data on the map.
   */
  private clearMapFeatures() {
    for (const regionType of this._data.regionTypes()) { //counties, coarse, fine
      const features = (<PolygonData>this._polygonData[regionType as PolygonLayerShortName]).features;
      for (let i = 0; i < features.length; i++) {
        const properties = features[i].properties;
        const place = properties.name;
        if (place in this._data.places(regionType as PolygonLayerShortName)) {
          properties.count = 0;
          properties["stats"] = 0;
        }
      }
    }
  }

  /**
   * Updates the data stored in the polygon data of the leaflet layers.
   */
  private updateRegionData() {
    for (const regionType of this._data.regionTypes()) { //counties, coarse, fine
      console.assert(polygonLayerShortNames.includes(regionType as PolygonLayerShortName));
      const regionData: PolygonData = <PolygonData>(this._polygonData)[regionType];
      const features: Feature[] = regionData.features;
      for (let i = 0; i < features.length; i++) {
        const featureProperties: Properties = features[i].properties;
        const place = featureProperties.name;
        const tweetRegionInfo: ProcessedPolygonData = this._data.regionData(regionType);
        if (tweetRegionInfo.hasPlace(place)) {
          featureProperties["count"] = tweetRegionInfo.countForPlace(place);
          featureProperties["stats"] = tweetRegionInfo.exceedanceForPlace(place);
        } else {
          log.verbose("No data for " + place);
        }
      }

    }
  }


  private _polygonData: ByRegionType<PolygonData | geojson.GeoJsonObject> = {
    county: fgsData,
    coarse: coarseData,
    fine:   fineData
  };

  private shortNumberLayerName(key: NumberLayerFullName): NumberLayerShortName {
    return <NumberLayerShortName>this._numberLayersNameMap[key];
  }

  /**
   * Read the live.json data file and process contents.
   */
  async load(first: boolean = false) {
    log.debug("load()");
    this.activity = true;
    try {
      if (!first) {
        //Save the time keys to adjust the slider to the new correct values.
        this._previousDateMin = this._data.reverseTimeKeys[-this._dateMin];
        this._previousDateMax = this._data.reverseTimeKeys[-this._dateMax];
      }
      await this._data.load();

      if (first) {
        await this._exec.queue("Update Slider", ["data-loaded"],
                               () => {this.updateSliderFromData();});
        this._exec.changeState("no-params");
      } else {
        await this.updateLayers("Data Load");
        await this._exec.queue("Update Slider", ["ready"],
                               () => {this.updateSliderFromData();});
        await this.updateSearch({min_offset: this._dateMin, max_offset: this._dateMax, abs_time: this._absoluteTime});
      }

      this._twitterIsStale = true;


    } catch (e) {
      this._exec.changeState("data-load-failed");
      setTimeout(() => {
        this._zone.run(() => this.load())
      }, 5000);
      this._notify.error(e)
      this.activity = false;
    }

  }


  private async updateLayers(reason: string = "") {
    return this._exec.queue("Update Layers: " + reason, ["ready", "data-loaded", "data-refresh"], async () => {
                              // Mark as stale to trigger a refresh
                              if (!this._updating) {
                                this.activity = true;
                                this._updating = true;
                                try {

                                  this._exec.changeState("data-refresh");
                                  await this._data.updateData(this._dateMin, this._dateMax);
                                  this.clearMapFeatures();
                                  this.updateRegionData();
                                  this.resetLayers(false);
                                  if (this._params) {

                                    this._exec.changeState("ready");
                                  } else {
                                    this._exec.changeState("no-params");
                                  }

                                } finally {
                                  this.activity = false;
                                  this._updating = false;
                                }
                              } else {
                                log.debug("Update in progress so skipping this update");
                              }
                            }
      , "", true, true).catch(e => {
      if (e !== DUPLICATE_REASON) {
        log.error(e);
      }
    });
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
    this._exec.queue("Tweets Visible", ["ready"], () => {
      this.tweetsVisible = true;
    }, "tweets.visible", true, true, true);
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
    this.sliderOptions = {...this.sliderOptions, startMin: this._dateMin, startMax: this._dateMax};
    //NB: The following are executed asynchronously
    this.updateSearch({min_offset: lower, max_offset: upper});
    this.updateLayers("Slider Change");
    this._twitterIsStale = true;

  }

  /**
   * Update the date slider after a data update.
   */
  async updateSliderFromData() {
    log.debug("updateSliderFromData()");
    this._dateMin = Math.max(this._previousDateMin ? this._data.offset(this._previousDateMin) : this._dateMin,
                             -(this._data.entryCount() - 1));
    this._dateMax = Math.max(this._previousDateMax ? this._data.offset(this._previousDateMax) : this._dateMax,
                             -(this._data.entryCount() - 1));
    this.sliderOptions = {
      max:      0,
      min:      -this._data.entryCount() + 1,
      startMin: this._dateMin,
      startMax: this._dateMax
    };
    this._absoluteTime = this._data.lastEntryDate().getTime();

  }

  /**
   * Triggered when the user has finished sliding the slider.
   * @param $event
   */
  public sliderChangeOnEnd($event: any) {
    log.debug("sliderChangeOnEnd()");

  }

  /**
   * Update the twitter panel using the currently selected feature.
   *
   */
  private async updateTwitter() {
    log.debug("updateTwitter()");
    await this._exec.queue("Update Twitter", ["ready"], () => {
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
    }, "", false, true, true);
  }
}
