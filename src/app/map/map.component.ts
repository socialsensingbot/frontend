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
import {ActivatedRoute, NavigationStart, Params, Router} from '@angular/router';
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
import {toTitleCase, getOS} from '../common';
import {RegionSelection} from './region-selection';


const log = new Logger('map');

const ONE_MINUTE_IN_MILLIS = 60000;

@Component({
             selector:    'app-map',
             templateUrl: './map.component.html',
             styleUrls:   ['./map.component.scss']
           })
export class MapComponent implements OnInit, OnDestroy {
  private _selectedFeatureNames: string[] = [];

  public get activePolyLayerShortName(): PolygonLayerShortName {
    return this._activePolyLayerShortName;
  }

  public set activePolyLayerShortName(value: PolygonLayerShortName) {
    log.debug("New baselayer " + value);
    if (!this.activePolyLayerShortName || this.activePolyLayerShortName === value) {
      this.updateSearch({active_polygon: value});
    } else {
      log.debug("Removing selected region(s) as we have changed region type");
      this.updateSearch({active_polygon: value, selected: null});
    }
    this._activePolyLayerShortName = value;
    this._exec.queue("Reset Layers", ["ready", "data-loaded"], () => {
      this.activity = true;
      this.resetLayers(true);
      this.activity = false;
    });


  }

  public get activeNumberLayerShortName(): NumberLayerShortName {
    return this._activeNumberLayerShortName;
  }

  public set activeNumberLayerShortName(value: NumberLayerShortName) {
    this._activeNumberLayerShortName = value;
    this.updateSearch({active_number: this._activeNumberLayerShortName});
    if (this._map) {
      for (let layer in this._numberLayers) {
        if (this._numberLayersNameMap[layer] !== value) {
          log.debug("Removing " + layer);
          this._map.removeLayer(this._numberLayers[layer]);
        }
      }
      for (let layer in this._numberLayers) {
        if (this._numberLayersNameMap[layer] === value) {
          log.debug("Adding " + layer);
          this._map.addLayer(this._numberLayers[layer]);

        }
      }
    }
    this._exec.queue("Reset Layers", ["ready", "data-loaded"], () => {
      this.activity = true;
      this.resetLayers(true);
      this.activity = false;
    });
  }


  // The Map & Map Layers
  private _statsLayer: LayerGroup = layerGroup();
  private _countyLayer: LayerGroup = layerGroup(); //dummy layers to fool layer control
  private _map: Map;

  private _numberLayers: NumberLayers = {"Exceedance": null, "Tweet Count": null};
  private _polyLayers: MapLayers = {"Local Authority": null, "Coarse Grid": null, "Fine Grid": null};
  private _polyLayersNameMap = {"Local Authority": "county", "Coarse Grid": "coarse", "Fine Grid": "fine"};
  private _numberLayersNameMap = {"Exceedance": "stats", "Tweet Count": "count"};

  private _activeNumberLayerShortName: NumberLayerShortName = STATS;
  private _activePolyLayerShortName: PolygonLayerShortName = COUNTY;


  private _oldClicked: (LeafletMouseEvent | "") = "";
  private _geojson: { stats: GeoJSON, count: GeoJSON } = {stats: null, count: null};


  // URL state management //

  // ... URL parameters
  private _dateMax = 0;
  private _dateMin = 0;
  private _absoluteTime: number;
  private _previousDateMin: string;
  private _previousDateMax: string;

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
  public selection = new RegionSelection();
  public tweetsVisible: boolean = false;
  public twitterPanelHeader: boolean;
  public activity: boolean = false;
  public ready: boolean = false;
  public sliderOptions: DateRangeSliderOptions = {
    max:      0,
    min:      -24 * 60 + 1,
    startMin: -24 * 60 + 1,
    startMax: 0
  };


  private _loggedIn: boolean;


  // Timed action triggers //
  private _twitterIsStale: boolean;

  // Timers for timed actions //
  private _twitterUpdateTimer: Subscription;
  private _loadTimer: Subscription;


  public showTwitterTimeline: boolean;
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
  _routerStateChangeSub: Subscription;
  _popState: boolean;

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
      const keys = {...this._newParams, ...params};
      this._newParams = {};
      Object.keys(keys).sort().forEach((key) => {
        this._newParams[key] = keys[key];
      });
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
      lng, lat, zoom, active_number, active_polygon, selected, min_time, max_time, min_offset, max_offset
    } = params;
    this._newParams = params;
    this._absoluteTime = this._data.lastEntryDate().getTime();
    this.sliderOptions.min = -this._data.entryCount() + 1;
    // These handle the date slider min_time & max_time values
    if (typeof min_time !== "undefined") {
      this._dateMin = +min_time;
      this.sliderOptions = {
        ...this.sliderOptions,
        startMin: this._data.offset(this._dateMin)
      };
    } else if (typeof min_offset !== "undefined") {
      this._dateMin = min_offset * ONE_MINUTE_IN_MILLIS + this._absoluteTime;
      this.sliderOptions = {...this.sliderOptions, startMin: min_offset};
    } else {
      this._dateMin = (-24 * 60 + 1) * ONE_MINUTE_IN_MILLIS + this._absoluteTime;
      this.sliderOptions = {...this.sliderOptions, startMin: (-24 * 60 + 1)};
    }
    if (typeof max_time !== "undefined") {
      this._dateMax = +max_time;
      this.sliderOptions = {
        ...this.sliderOptions,
        startMax: this._data.offset(this._dateMax)
      };
    } else if (typeof max_offset !== "undefined") {
      this._dateMax = max_offset * ONE_MINUTE_IN_MILLIS + this._absoluteTime;
      this.sliderOptions = {...this.sliderOptions, startMax: max_offset};
    } else {
      this._dateMax = this._absoluteTime;
      this.sliderOptions = {...this.sliderOptions, startMax: 0};
    }

    // this._notify.show(JSON.stringify(this.sliderOptions));
    log.debug("Slider options: ", this.sliderOptions);
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
      if (Array.isArray(selected)) {
        this._selectedFeatureNames = selected;
      } else {
        this._selectedFeatureNames = [selected];
      }
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


                           this._exec.changeState("ready");
                           this.updateSearch({
                                               min_time: Math.round(this._dateMin),
                                               max_time: Math.round(this._dateMax)
                                             });
                           // map.addControl(zoomControl);
                           // this.addToggleControls();
                           return this.updateLayers("From Parameters").then(() => this._twitterIsStale = true);

                         });
      } else {
        if (this._popState) {
          log.debug("POP STATE detected during URL query params change.");
          this._popState = false;
          this.activity = true;
          this.updateMapFromQueryParams(params);
          this.resetLayers(true);
          return this.updateLayers("From Back Button")
                     .then(() => this._twitterIsStale = true).then(() => this.activity = false);
        }
      }

    });


    // Schedule periodic data loads from the server
    this._loadTimer = timer(ONE_MINUTE_IN_MILLIS, ONE_MINUTE_IN_MILLIS).subscribe(() => this.load());
  }

  // private addToggleControls() {
  //   log.debug("addToggleControls()");
  //   for (let key in this._basemapControl) {
  //     // noinspection JSUnfilteredForInLoop
  //     this._lcontrols[key] = control.layers(this._basemapControl[key], {}).addTo(this._map);
  //     // noinspection JSUnfilteredForInLoop
  //     this._lcontrols[key].setPosition('topleft');
  //   }
  //
  // }


  /**
   * When the user places their mouse over a feature (region) this is called.
   * @param e
   */
  featureEntered(e: LeafletMouseEvent) {
    log.debug("featureEntered()");
    const feature = e.target.feature;
    const exceedanceProbability: number = Math.round(feature.properties.stats * 100) / 100;
    const region: string = toTitleCase(feature.properties.name);
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
    log.debug("Highlighting ", e.target.feature);
    const feature = e.target.feature;
    const count: number = feature.properties.count;
    e.target.setStyle({
                        stroke:      true,
                        weight,
                        color:       '#000000',
                        dashArray:   '',
                        fillOpacity: count > 0 ? 1.0 : 0.5,
                      });

    if (!Browser.ie && !Browser.opera && !Browser.edge) {
      e.target.bringToFront();
    }
  }

  private unhighlight(e: LeafletMouseEvent) {
    log.debug("Un-highlighting ", e.target.feature);
    const feature = e.target.feature;
    const count: number = feature.properties.count;
    e.target.setStyle({
                        stroke:      true,
                        weight:      1,
                        color:       '#FFFFFF',
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
  updateTwitterPanel() {
    const features = this.selection.features();
    if (features.length === 1) {
      const feature = features[0];
      log.debug(`updateTwitterPanel() ${JSON.stringify(feature)}`);
      if (feature.properties.count > 0) {
        log.debug("Count > 0");
        log.debug(`this.activePolyLayerShortName=${this.activePolyLayerShortName}`);
        this.tweets = this._data.tweets(this.activePolyLayerShortName, this.selection.regionNames());
        log.debug(this.tweets);
        this.twitterPanelHeader = true;
        this.showTwitterTimeline = true;
        this.showTweets()
      } else {
        log.debug(`Count == ${feature.properties.count}`);
        this.twitterPanelHeader = true;
        this.showTwitterTimeline = false;
        this.tweets = [];
      }
    } else if (features.length === 0) {
      this.showTwitterTimeline = false;
      this.tweets = [];
      this.hideTweets();
    } else {
      this.tweets = this._data.tweets(this.activePolyLayerShortName, this.selection.regionNames());
      log.debug(this.tweets);
      this.twitterPanelHeader = true;
      this.showTwitterTimeline = true;
    }


  };

  /**
   * Mouse out event.
   * @param e
   */
  featureLeft(e: LeafletMouseEvent) {
    log.debug("featureLeft(" + this._activeNumberLayerShortName + ")");
    if (this.selection.isSelected(e.target.feature)) {
      this.highlight(e);
    } else {
      this.unhighlight(e);
    }
  }


  /**
   * Mouse click event.
   * @param e
   */
  featureClicked(e: LeafletMouseEvent) {
    log.debug("featureClicked()");
    log.debug(e.target.feature.properties.name);
    if (this.isMultiSelect(e)) {
      this.selection.toggle(e.target.feature);
    } else {
      this._geojson[this.activeNumberLayerShortName].resetStyle(e.propagatedFrom);
      this.selection.selectOnly(e.target.feature);
    }
    this.updateSearch({selected: this.selection.regionNames()});
    this._selectedFeatureNames = this.selection.regionNames();
    this.updateTwitterPanel();
    if (this.selection.isSelected(e.target.feature)) {
      this.highlight(e, 3);
    } else {
      this.highlight(e);
    }

  }


  private isMultiSelect(e: LeafletMouseEvent) {
    return (getOS() === "Mac OS" && e.originalEvent.metaKey) || (getOS() !== "Mac OS" && e.originalEvent.altKey);
  }

  onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: GeoJSON) {
    log.verbose("onEachFeature()");

    // If this feature is referenced in the URL query parameters selected
    // e.g. ?...&selected=powys&selected=armagh
    // then highlight it and update Twitter
    if (this._selectedFeatureNames.includes(feature.properties.name)) {
      log.debug("Matched " + feature.properties.name);

      //Put the selection outline around the feature
      layer.setStyle({
                       stroke:      true,
                       weight:      3,
                       color:       '#000000',
                       dashArray:   '',
                       fillOpacity: feature.properties.count > 0 ? 1.0 : 0.01,
                     });

      if (!Browser.ie && !Browser.opera && !Browser.edge) {
        layer.bringToFront();
      }

      this.selection.select(feature as Feature);
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

    this._routerStateChangeSub = this._router.events
                                     .subscribe(async (event: NavigationStart) => {
                                       if (event.navigationTrigger === 'popstate') {
                                         this._popState = true;
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
    if (this._routerStateChangeSub) {
      this._routerStateChangeSub.unsubscribe();
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
        this.selection.clear();
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
      await this._data.load();

      if (first) {
        await this._exec.queue("Update Slider", ["data-loaded"],
                               () => {this.updateSliderFromData();});
        this._exec.changeState("no-params");
      } else {
        await this.updateLayers("Data Load");
        await this._exec.queue("Update Slider", ["ready"],
                               () => {this.updateSliderFromData();});
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

                                } finally {
                                  this.activity = false;
                                  this._updating = false;
                                  if (this._params) {
                                    this._exec.changeState("ready");
                                  } else {
                                    this._exec.changeState("no-params");
                                  }
                                }
                              } else {
                                log.debug("Update in progress so skipping this update");
                              }
                            }
      , reason, true, true).catch(e => {
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
    log.debug("sliderChange(" + lower + "->" + upper + ")");
    log.debug(`
    sliderChange(range from ${lower} to ${upper})

    Min: ${this.sliderOptions.startMin} => ${lower}
    Min (Tics delta): ${this.sliderOptions.startMin - lower}
    Min (Mins delta): ${(this._dateMin - this._data.entryDate(lower).getTime()) / ONE_MINUTE_IN_MILLIS}
    Min: ${this._dateMin} => ${this._data.entryDate(lower).getTime()}


    Max: ${this.sliderOptions.startMax} => ${upper}
    Max (Tics delta): ${this.sliderOptions.startMax - upper}
    Max (Mins delta): ${(this._dateMax - this._data.entryDate(upper).getTime()) / ONE_MINUTE_IN_MILLIS}
    Max: ${this._dateMax} => ${this._data.entryDate(upper).getTime()}


    `);
    this._dateMax = this._data.entryDate(upper).getTime();
    this._dateMin = this._data.entryDate(lower).getTime();
    this.sliderOptions = {...this.sliderOptions, startMin: lower, startMax: upper};
    //NB: The following are executed asynchronously
    this.updateSearch({min_time: this._dateMin, max_time: this._dateMax});
    this.updateLayers("Slider Change");
    this._twitterIsStale = true;

  }

  /**
   * Update the date slider after a data update.
   */
  async updateSliderFromData() {
    log.debug("updateSliderFromData()");
    this._absoluteTime = this._data.lastEntryDate().getTime();
    this._dateMin = Math.max(this._dateMin,
                             this._absoluteTime - ((this._data.entryCount() - 1) * ONE_MINUTE_IN_MILLIS));
    this._dateMax = Math.max(this._dateMax,
                             this._absoluteTime - ((this._data.entryCount() - 1) * ONE_MINUTE_IN_MILLIS));
    this.sliderOptions = {
      max:      0,
      min:      -this._data.entryCount() + 1,
      startMin: this._data.offset(this._dateMin),
      startMax: this._data.offset(this._dateMax)
    };

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
      // this.selectedRegion.toggle(this._clicked.target.feature.properties.name,this._clicked.target.feature.geometry);
      this.updateTwitterPanel();
    }, Date.now(), false, true, true);
  }

  public downloadTweetsAsCSV() {
    this._data.download(this.activePolyLayerShortName,
                        this._polygonData[this.activePolyLayerShortName] as PolygonData);
  }

  public polyLayers() {
    return [["Local Authority", "county"], ["Coarse Grid", "coarse"], ["Fine Grid", "fine"]];
  }

  public numberLayers() {
    return [["Exceedance", "stats"], ["Tweet Count", "count"]];
  }

  public zoomIn() {
    if (this._map.getZoom() < 18) {
      this._map.setZoom(this._map.getZoom() + 1);
    } else {
      this._notify.show("Maximum Zoom")
    }
  }

  public zoomOut() {
    if (this._map.getZoom() > 2) {
      this._map.setZoom(this._map.getZoom() - 1);
    } else {
      this._notify.show("Minimum Zoom")
    }
  }
}
