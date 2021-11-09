import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {Browser, GeoJSON, latLng, LayerGroup, layerGroup, LeafletMouseEvent, Map, tileLayer} from "leaflet";
import "jquery-ui/ui/widgets/slider.js";
import {ActivatedRoute, NavigationStart, Params, Router} from "@angular/router";
import * as rxjs from "rxjs";
import {Subscription, timer} from "rxjs";
import * as geojson from "geojson";
import {DateRange, DateRangeSliderOptions} from "./date-range-slider/date-range-slider.component";
import {LayerStyleService} from "./services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {COUNTY, Feature, NumberLayerShortName, PolygonData, PolyLayers, STATS} from "./types";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {AppState, UIExecutionService} from "../services/uiexecution.service";
import {ColorCodeService} from "./services/color-code.service";
import {Tweet} from "./twitter/tweet";
import {getOS, roundToHour, roundToMinute} from "../common";
import {RegionSelection} from "./region-selection";
import {PreferenceService} from "../pref/preference.service";
import {NgForageCache} from "ngforage";
import {environment} from "../../environments/environment";
import Auth from "@aws-amplify/auth";
import {DashboardService} from "../pref/dashboard.service";
import {LoadingProgressService} from "../services/loading-progress.service";
import {ONE_DAY} from "./data/map-data";
import {RESTMapDataService} from "./data/rest-map-data.service";
import {TwitterExporterService} from "./twitter/twitter-exporter.service";
import {MapSelectionService} from "../map-selection.service";


const log = new Logger("map");

const ONE_MINUTE_IN_MILLIS = 60000;

@Component({
               selector:    "app-map",
               templateUrl: "./map.component.html",
               styleUrls:   ["./map.component.scss"]
           })
export class MapComponent implements OnInit, OnDestroy {
    private currentStatisticsLayer: LayerGroup<any> = layerGroup();
    private destroyed = false;
    private resetThisStatsLayer: string;
    private _updateStatsLayerTimer: Subscription;

    public set selectedFeatureNames(value: string[]) {
        this._selectedFeatureNames = value;
        this.updateSearch({selected: value});
    }

    public get selectedFeatureNames(): string[] {
        return this._selectedFeatureNames;
    }

    // The UI state fields
    public tweets: Tweet[] = null;
    public tweetsVisible = false;
    public twitterPanelHeader: boolean;
    public activity = false;
    public ready = false;
    public sliderOptions: DateRangeSliderOptions = {
        max:      Date.now(),
        min:      Date.now() - 7 * ONE_DAY,
        startMin: Date.now() - ONE_DAY,
        startMax: Date.now()
    };
    public selection = new RegionSelection();
    public showTwitterTimeline: boolean;
    _routerStateChangeSub: Subscription;
    _popState: boolean;
    public selectedCountries: string[] = [];
    // }
    public appToolbarExpanded: boolean;
    public liveUpdating = false;
    //     //                             this.data.polygonData[this.activePolyLayerShortName] as PolygonData);
    public blinkOn = true;
    // The Map & Map Layers
    private _statsLayer: LayerGroup = layerGroup();
    private _countyLayer: LayerGroup = layerGroup(); // dummy layers to fool layer control
    public options: any = {
        layers: [
            tileLayer(
                // tslint:disable-next-line:max-line-length
                environment.mapTileUrlTemplate,
                {
                    maxZoom:     18,
                    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, " +
                                     "<a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, " +
                                     "Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
                    id:          "mapbox/streets-v11",
                    tileSize:    512,
                    zoomOffset:  -1
                }),
            this._statsLayer,
            this._countyLayer
        ],
        zoom:   4,
        center: latLng([53, -2])
    };
    private _map: Map;
    private _polyLayers: PolyLayers = {county: null, coarse: null, fine: null};
    // URL state management //
    private _geojson: { stats: GeoJSON, count: GeoJSON } = {stats: null, count: null};
    // ... URL parameters
    private _dateMax = 0;
    private _dateMin = 0;
    private _absoluteTime: number;
    /**
     * True if the query parameters have been processed.
     */
    private _params = false;
    /**
     * A subscription to the URL search parameters state.
     */
    private _searchParams: rxjs.Observable<Params>;
    /**
     * The new parameters that should be merged into the existing parameters.
     */
    private _newParams: Partial<Params>;
    private _selectedFeatureNames: string[] = [];
    private _loggedIn: boolean;
    // Timed action triggers //
    private _twitterIsStale = false;
    private _sliderIsStale = false;
    // Timers for timed actions //
    private _twitterUpdateTimer: Subscription;
    private _sliderUpdateTimer: Subscription;
    private _loadTimer: Subscription;
    /**
     * True during a layer update
     */
    private _updating: boolean;
    /**
     * A subscription to the UI execution state.
     */
    private _stateSub: Subscription;
    private DEFAULT_LAYER_GROUP = "flood-group";
    private _blinkTimer: Subscription;
    private _inFeature: boolean;
    public selectedCountriesTextValue = "";

    public set dataset(value: string) {
        if (this.destroyed) {
            return;
        }
        log.debug("set dataset");
        if (value && value !== this._dataset) {
            this.activity = true;
            this._updating = true;
            this.ready = false;
            this._dataset = value;
            this._router.navigate(["/map", value], {queryParams: this._newParams, queryParamsHandling: "merge"});
            const oldLocation = this.data.mapMetadata.location;
            this.data.switchDataSet(value).then(async () => {
                this.hideTweets();
                if (this._activeRegionType) {
                    await this.data.loadGeography(this._activeRegionType);
                }
                log.debug(`Old location ${oldLocation} new location ${this.data.mapMetadata.location}`);
                if (this.data.mapMetadata.location !== oldLocation) {
                    this.selection.clear();
                    const {zoom, lng, lat} = {
                        ...this.data.serviceMetadata.start,
                        ...this.data.mapMetadata.start,
                    };
                    await this.updateSearch({zoom, lng, lat, selected: null});
                    this._map.setView(latLng([lat, lng]), zoom, {animate: true, duration: 6000});
                }
                this.ready = true;
                this._updating = false;
                await this.load(false, true);
            }).finally(() => {
                this.activity = false;

            });
        }
    }

    private _activeLayerGroup: string = this.DEFAULT_LAYER_GROUP;

    public get activeLayerGroup(): string {
        return this._activeLayerGroup;
    }

    //     //                             this.activePolyLayerShortName,
    public annotationTypes: any[] = [];

    private _dataset: string;

    public get dataset(): string {
        return this._dataset;
    }

    constructor(private _router: Router,
                private route: ActivatedRoute,
                private _mapSelectionService: MapSelectionService,
                private _zone: NgZone,
                private _layerStyles: LayerStyleService,
                private _notify: NotificationService,
                private _auth: AuthService,
                private _http: HttpClient,
                private _exec: UIExecutionService,
                private _color: ColorCodeService,
                public data: RESTMapDataService,
                public _exporter: TwitterExporterService,
                public pref: PreferenceService,
                private readonly cache: NgForageCache,
                public dash: DashboardService,
                public loading: LoadingProgressService
    ) {
        // save the query parameter observable
        this._searchParams = this.route.queryParams;


    }

    private _activeStatistic: NumberLayerShortName;

    public get activeStatistic(): NumberLayerShortName {
        return this._activeStatistic;
    }

    public set activeStatistic(value: NumberLayerShortName) {
        log.debug("set activeStatistic");
        if (this._activeStatistic !== value) {
            this._activeStatistic = value;
            this.updateSearch({active_number: this._activeStatistic});
            this.scheduleResetLayers(value, false);
        }
    }

    private _activeRegionType: string;

    public get activeRegionType(): string {
        return this._activeRegionType;
    }

    public set activeRegionType(value: string) {
        log.debug("activeRegionType(" + value + ")");
        if (!this.activeRegionType) {
            this.updateSearch({active_polygon: value});
        } else {
            log.debug("Removing selected region(s) as we have changed region type");
            this.updateSearch({active_polygon: value, selected: null});
        }

        if (this.activeRegionType !== value) {
            this._activeRegionType = value;
        }
        this.scheduleResetLayers(this.activeStatistic);
    }

    /**
     * Called when the map element has finished initialising.
     */
    onMapReady(map: Map) {
        log.debug("onMapReady");
        this._map = map;
        // this.ready= true;
        this.init(map);
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
        return await this._exec.queue("Update URL Query Params", ["ready", "data-refresh"], async () => {
            const keys = {...this._newParams, ...params};
            this._newParams = {};
            Object.keys(keys).sort().forEach((key) => {
                this._newParams[key] = keys[key];
            });
            await this._router.navigate(["map", this._mapSelectionService.id], {
                queryParams:         this._newParams,
                queryParamsHandling: "merge"
            });
        }, JSON.stringify(params), false, true);

    }

    async ngOnInit() {
        // Because of the impact on the user experience we prevent overlapping events from occurring
        // and throttle those events also. The prevention of overlapping events is done by the use
        // of a flag and queued events. The throttling is acheived by the the periodicity of the
        // schedulers execution.

        if (this.destroyed) {
            return;
        }

        // Avoids race condition with access to this.pref.combined
        await this.pref.waitUntilReady();
        if (!this._mapSelectionService.id && this.route.snapshot.params.map === "undefined") {
            log.debug("Redirecting to /map/" + this.pref.combined.defaultDataSet);
            this._mapSelectionService.id = this.pref.combined.defaultDataSet;
            await this._router.navigate(["map", this.pref.combined.defaultDataSet], {queryParamsHandling: "preserve"});
        }
        if (this._mapSelectionService.id && this.route.snapshot.params.map === "undefined") {
            log.debug("Redirecting to /map/" + this._mapSelectionService.id);
            await this._router.navigate(["map", this._mapSelectionService.id], {queryParamsHandling: "preserve"});
        }
        this._stateSub = this._exec.state.subscribe((state: AppState) => {
            if (state === "ready") {
                log.debug("Setting this to be ready");
                this.ready = true;
            }
        });

        let twitterUpdateInProgress = false;
        this._twitterUpdateTimer = timer(0, 1000).subscribe(async () => {
            if (!twitterUpdateInProgress) {
                if (this._twitterIsStale) {
                    log.debug("Twitter is stale");
                    twitterUpdateInProgress = true;
                    this._twitterIsStale = false;
                    await this.updateTwitter();
                    twitterUpdateInProgress = false;
                }
            }
        });

        let sliderUpdateInProgress = false;
        this._sliderUpdateTimer = timer(0, 100).subscribe(async () => {
            if (!sliderUpdateInProgress) {
                if (this._sliderIsStale) {
                    log.debug("Slider is stale");
                    sliderUpdateInProgress = true;
                    this._sliderIsStale = false;
                    await this.updateFromSlider();
                    sliderUpdateInProgress = false;
                }
            }
        });


        this._blinkTimer = timer(0, this.pref.combined.blinkRateInMilliseconds).subscribe(async () => {
            this.blinkOn = !this.blinkOn;
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
                                             if (event.navigationTrigger === "popstate") {
                                                 this._popState = true;
                                             }
                                         });

        log.debug("Initialized");
    }

    /**
     * Clear up when the component is destroyed.
     */
    ngOnDestroy() {
        this.destroyed = true;
        if (this._loadTimer) {
            this._loadTimer.unsubscribe();
        }
        if (this._twitterUpdateTimer) {
            this._twitterUpdateTimer.unsubscribe();
        }
        if (this._sliderUpdateTimer) {
            this._sliderUpdateTimer.unsubscribe();
        }
        if (this._updateStatsLayerTimer) {
            this._updateStatsLayerTimer.unsubscribe();
        }
        if (this._stateSub) {
            this._stateSub.unsubscribe();
        }
        if (this._routerStateChangeSub) {
            this._routerStateChangeSub.unsubscribe();
        }
        if (this._blinkTimer) {
            this._blinkTimer.unsubscribe();
        }
        this._map.eachLayer((layer) => {
            this._map.removeLayer(layer);
        });
        let timeoutIndex = 0;
        const watcher = setInterval(() => {
            this._zone.run(() => {
                timeoutIndex++;
                if (this._map && this._map.remove) {
                    try {
                        this._map.off();
                        this._map.remove();
                        this._map = null;
                        log.debug("MAP Destroyed");

                        clearInterval(watcher);
                    } catch (e) {
                        log.warn(e);
                    }
                }
                if (timeoutIndex > 10) {  //wait for 2 seconds before giving up
                    log.debug("MAP Could not be destroyed");
                    clearInterval(watcher);
                }
            });
        }, 200);
        log.debug("Destroyed");

    }

    /**
     * Read the live.json data file and process contents.
     */
    async load(first: boolean = false, clearSelected = false) {
        if (this.destroyed) {
            return;
        }
        log.debug("load(" + first + "," + clearSelected + ")");
        if (!this._loggedIn) {
            log.warn("User logged out, not performing load.");
            return;
        }
        // noinspection ES6MissingAwait
        return this._exec.queue("Map Load", null, async () => {
            try {

                await this.data.load(first);

                if (first) {
                    this._exec.changeState("no-params");
                    // noinspection ES6MissingAwait
                    this.updateSliderFromData();
                } else {
                    await this.updateLayers("Data Load", clearSelected);
                    await this._exec.queue("Update Slider", ["ready"],
                                           () => {
                                               this.updateSliderFromData();
                                           }, null, true, true, true);
                }

                this._twitterIsStale = true;

            } catch (e) {
                log.error(e);
                this._notify.error(e);
            } finally {
            }
        }, true, false, true, true, "inactive", 200000, 10);
        ;


    }

    /**
     * Triggered by a change to the date range slider.
     *
     * @see DateRangeSliderComponent
     * @param range the user selected upper and lower date range.
     */
    public sliderChange(range: DateRange) {
        if (this.destroyed) {
            return;
        }
        // tslint:disable-next-line:prefer-const
        let {lower, upper} = range;
        log.debug("sliderChange(" + lower + "->" + upper + ")");
        this._dateMax = upper;
        this._dateMin = roundToHour(Math.max(this.sliderOptions.min, lower));
        this.sliderOptions.startMin = this._dateMin;
        this.sliderOptions.startMax = this._dateMax;

        this.updateSearch({min_time: this._dateMin, max_time: this._dateMax});
        if (this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }

    }

    // public downloadAggregateAsCSV(aggregrationSetId: string, id: string, $event: MouseEvent) {
    //     // this.data.downloadAggregate(aggregrationSetId, id,

    public set activeLayerGroup(value: string) {
        log.debug("set activeLayerGroup");
        this._activeLayerGroup = value;
        if (this.ready) {
            this.scheduleResetLayers(this.activeStatistic, false);
        }
        this.updateSearch({active_layer: this._activeLayerGroup});
        this._twitterIsStale = true;
        this.updateAnnotationTypes();
        this.load();
    }

    /**
     * Triggered when the user has finished sliding the slider.
     */
    public sliderChangeOnEnd(range: DateRange) {
        if (this.destroyed) {
            return;
        }
        log.info("sliderChangeOnEnd()", range);
        if (!this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }


    }

    public async downloadTweetsAsCSV() {
        if (this.destroyed) {
            return;
        }
        log.debug("downloadTweetsAsCSV()");
        log.debug(this.data.regionGeography);
        log.debug(this.activeRegionType);
        if (this.data.hasCountryAggregates()) {
            await this._exporter.downloadAggregate(this.activeLayerGroup, "uk-countries", this.selectedCountries,
                                                   this.activeRegionType,
                                                   await this.data.geoJsonGeographyFor(this.activeRegionType) as PolygonData, this._dateMin,
                                                   this._dateMax);
        } else {
            await this._exporter.download(this.activeLayerGroup, await this.data.geoJsonGeographyFor(this.activeRegionType) as PolygonData,
                                          this.activeRegionType,
                                          this._dateMin, this._dateMax);
        }
    }

    public zoomIn() {
        if (this.destroyed) {
            return;
        }

        log.debug("zoomIn()");
        if (this._map.getZoom() < 18) {
            this._map.setZoom(this._map.getZoom() + 1);
        } else {
            this._notify.show("Maximum Zoom");
        }
    }

    public zoomOut() {
        if (this.destroyed) {
            return;
        }

        log.debug("zoomOut()");
        if (this._map.getZoom() > 2) {
            this._map.setZoom(this._map.getZoom() - 1);
        } else {
            this._notify.show("Minimum Zoom");
        }
    }

    public calculateSelectedCountriesText(value: string[]) {
        if (this.destroyed) {
            return;
        }
        this.selectedCountries = value;
        log.debug("selectedCountriesText(" + value + ")");
        // log.info(countries.value);
        if (!this.selectedCountries || this.selectedCountries.length === 0) {
            log.debug("None");
            this.selectedCountriesTextValue = "Download none";
        } else {
            const countryCount = this.selectedCountries.length;
            const countryData = this.data.aggregations["uk-countries"].aggregates;
            if (countryData.length === countryCount) {
                this.selectedCountriesTextValue = "Download all";
            } else {
                if (countryCount === 1) {
                    const countryTitle = countryData.filter(
                        i => i.id === this.selectedCountries[0])[0].title;
                    this.selectedCountriesTextValue = `Download ${countryTitle}`;
                } else {
                    this.selectedCountriesTextValue = `Download ${countryCount} countries`;
                }
            }
        }
    }

    public async timeSliderPreset(mins: number) {
        log.debug("timeSliderPreset()");
        if (this.destroyed) {
            return;
        }
        const now: number = await this.data.now();
        await this.sliderChange({lower: roundToHour(now - mins * ONE_MINUTE_IN_MILLIS), upper: roundToMinute(now)});
        this.sliderOptions = {
            max:      roundToMinute(now),
            min:      roundToHour(await this.data.minDate()),
            startMin: roundToHour(now - mins * ONE_MINUTE_IN_MILLIS),
            startMax: roundToMinute(now)
        };
        this._sliderIsStale = true;
    }

    private async scheduleResetLayers(layer: string, clearSelected = true) {
        if (this.destroyed) {
            return;
        }
        log.debug("scheduleResetLayers()");
        await this._exec.queue("Reset Layers", ["ready"], async () => {
            this.activity = true;
            await this.resetStatisticsLayer(layer, clearSelected);
            this.activity = false;
        }, layer, false, false, true);
    }

    /**
     * Update the map from the query parameters.
     *
     * @param params the new value for the query parameters.
     */
    private async updateMapFromQueryParams(params: Params) {
        if (this.destroyed) {
            return;
        }

        log.debug("updateMapFromQueryParams()");
        log.debug("Params:", params);
        const {
            lng,
            lat,
            zoom,
            active_number,
            active_polygon,
            selected,
            min_time,
            max_time,
            min_offset,
            max_offset,
            active_layer
        } = params;
        this._newParams = params;
        this._absoluteTime = await this.data.now();
        this.sliderOptions.min = await this.data.minDate();
        // These handle the date slider min_time & max_time values
        if (typeof min_time !== "undefined") {
            this._dateMin = roundToHour(Math.max(+min_time, this.sliderOptions.min));
        } else {
            this._dateMin = roundToHour(await this.data.now() - (ONE_DAY));
        }
        this.sliderOptions = {
            ...this.sliderOptions,
            startMin: this._dateMin
        };
        if (typeof max_time !== "undefined") {
            this._dateMax = roundToMinute(Math.min(+max_time, await this.data.now()));
        } else {
            this._dateMax = roundToMinute(await this.data.now());
        }
        this.sliderOptions = {...this.sliderOptions, startMax: this._dateMax};
        if (typeof active_layer !== "undefined") {
            this.activeLayerGroup = active_layer;
        }

        await this.checkForLiveUpdating();
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
            viewChange = newZoom !== zoom || viewChange;
            newZoom = zoom;
        }
        if (viewChange) {
            this._map.setView(newCentre, newZoom, {animate: true, duration: 3000});
        }

        // This handles a change to the active_number value
        this.activeStatistic = typeof active_number !== "undefined" ? active_number : STATS;


        // This handles a change to the active_polygon value
        this.activeRegionType = typeof active_polygon !== "undefined" ? active_polygon : COUNTY;


        // If a polygon (region) is selected update Twitter panel.
        if (typeof selected !== "undefined") {
            if (Array.isArray(selected)) {
                this.selectedFeatureNames = selected;
            } else {
                this.selectedFeatureNames = [selected];
            }
        }

        log.debug("updateMapFromQueryParams() finished");
        return undefined;
    }

    /**
     * This method does all the heavy lifting and is called when
     * the map is ready and data is loaded.
     * @param map the leaflet.js Map
     */
    private async init(map: Map) {
        if (this.destroyed) {
            return;
        }

        map.addEventListener("click", event => {
            this._zone.run(args => {
                if (!this._inFeature) {
                    this.clearSelectedRegions();
                }
            });
        });
        // noinspection ES6MissingAwait
        this.dash.init();
        log.debug("init");
        // map.zoomControl.remove();
        await this.pref.waitUntilReady();
        this.activity = true;
        if (this.route.snapshot.paramMap.has("map")) {
            this._dataset = this.route.snapshot.paramMap.get("map");
        } else {
            this._dataset = this.pref.combined.defaultDataSet;
        }
        await this.data.init(this.dataset);
        if (this.route.snapshot.queryParamMap.has("layer_group")) {
            this._activeLayerGroup = this.route.snapshot.queryParamMap.get("layer_group");
        } else {
            this._activeLayerGroup = this.pref.defaultLayer().id;
        }
        this.updateAnnotationTypes();

        if (this.route.snapshot.queryParamMap.has("active_polygon")) {
            this._activeRegionType = this.route.snapshot.queryParamMap.get("active_polygon");
        } else {
            this._activeRegionType = this.data.mapMetadata.defaultRegionType;
        }
        if (this._activeRegionType) {
            await this.data.loadGeography(this._activeRegionType);
        }
        if (this.data.hasCountryAggregates()) {
            this.data.aggregations["uk-countries"].aggregates.forEach(i => this.selectedCountries.push(i.id));
        }
        const {zoom, lng, lat} = {
            ...this.data.serviceMetadata.start,
            ...this.data.mapMetadata.start,
            ...this.route.snapshot.queryParams,
            ...this._newParams
        };
        this._map.setView(latLng([lat, lng]), zoom, {animate: true, duration: 4000});


        this._loggedIn = await Auth.currentAuthenticatedUser() != null;

        this._exec.changeState("map-init");
        this.load(true).then(() => this.loading.loaded());

        // noinspection ES6MissingAwait
        this.checkForLiveUpdating();
        this._searchParams.subscribe(async params => {

            if (!this._params) {
                this._params = true;
                // noinspection ES6MissingAwait
                this._exec.queue("Initial Search Params", ["no-params"],
                                 async () => {
                                     if (this.destroyed) {
                                         return;
                                     }
                                     log.debug("Initial Search Parameters lambda started");
                                     await this.updateMapFromQueryParams(params);
                                     this._exec.changeState("ready");

                                     // Listeners to push map state into URL
                                     map.addEventListener("dragend", () => {
                                         return this._zone.run(
                                             () => this.updateSearch(
                                                 {lat: this._map.getCenter().lat, lng: this._map.getCenter().lng}));
                                     });

                                     map.addEventListener("zoomend", (event) => {
                                         return this._zone.run(() => this.updateSearch({zoom: this._map.getZoom()}));
                                     });

                                     await this.updateLayers("From Parameters");
                                     log.debug("Queued layer update");
                                     // Schedule periodic data loads from the server
                                     this._loadTimer = timer(0, ONE_MINUTE_IN_MILLIS)
                                         .subscribe(async () => {
                                             this.activity = true;
                                             await this.load();
                                             this.activity = false;

                                         });
                                     this._notify.dismiss();
                                     this.loading.loaded();
                                     this.activity = false;
                                     log.debug("Initial Search Parameters lambda completed");
                                 }, null, false, false, true, null, 1000, 3);
            } else {
                if (this._popState) {
                    log.debug("POP STATE detected before URL query params change.");
                    this._popState = false;
                    this.activity = true;
                    await this.updateMapFromQueryParams(params);
                    return this.updateLayers("Pop State", true)
                               .then(() => this._twitterIsStale = true)
                               .finally(() => this.activity = false);
                }
            }

        });
        log.debug("Init completed successfully");

    }

    private updateAnnotationTypes(): void {
        log.debug("Finding annotations for layer ", this._activeLayerGroup);
        const currentLayer: any = this.pref.combined.layers.available.filter(i => i.id == this._activeLayerGroup)[0];
        log.debug("Finding annotations for layer ", currentLayer);
        if (currentLayer) {
            let activeAnnotationTypes: any = currentLayer.annotations;
            log.debug("Available annotations are ", activeAnnotationTypes);
            this.annotationTypes = this.pref.combined.annotations.filter(
                i => typeof activeAnnotationTypes === "undefined" || activeAnnotationTypes.includes(i.name));
            log.debug("Annotations are ", this.annotationTypes);
        }
    }

    private async clearSelectedRegions() {
        log.debug("clearSelectedRegions()");
        if (this.destroyed) {
            return;
        }
        await this.updateSearch({selected: []});
        this.selectedFeatureNames = [];
        await this.scheduleResetLayers(this.activeStatistic, true);
    }

    /**
     * When the user places their mouse over a feature (region) this is called.
     */
    private featureEntered(e: LeafletMouseEvent) {
        if (this.destroyed) {
            return;
        }
        const feature = e.target.feature;
        const exceedanceProbability: number = Math.round(feature.properties.stats * 100) / 100;
        const region: string = feature.properties.title;
        const count: number = feature.properties.count;
        this.highlight(e.target, 1);

        let text = "" +
            `<div>Region: ${region}</div>`;
        if (count > 0) {
            text = text +
                `<div>Count: ${count}</div>`;
            if ("" + exceedanceProbability !== "NaN") {
                text = text + `<div>Exceedance: ${exceedanceProbability}</div>`;
            }
        }

        this._inFeature = true;

        e.target.bindTooltip(text).openTooltip();
    }

    private highlight(target: any, weight: number = 3) {
        log.verbose("Highlighting ", target.feature);
        if (this.destroyed) {
            return;
        }
        const feature = target.feature;
        const count: number = feature.properties.count;
        target.setStyle({
                            stroke:      true,
                            weight,
                            color:       "#B1205F",
                            opacity:     0.7,
                            dashArray:   "",
                            fillOpacity: count > 0 ? 0.5 : 0.1,
                        });

        if (!Browser.ie && !Browser.opera && !Browser.edge) {
            target.bringToFront();
        }
    }

    private unhighlight(target: any) {
        log.verbose("Un-highlighting ", target.feature);
        if (this.destroyed) {
            return;
        }
        const feature = target.feature;
        const count: number = feature.properties.count;
        target.setStyle({
                            stroke:      true,
                            weight:      1,
                            opacity:     0.5,
                            color:       "white",
                            dashArray:   "",
                            fillOpacity: count > 0 ? 0.7 : 0.1,
                        });

        if (!Browser.ie && !Browser.opera && !Browser.edge) {
            target.bringToFront();
        }
    }

    /**
     * Update the Twitter panel by updating the properties it reacts to.
     */
    private async updateTwitterPanel() {
        log.debug("updateTwitterPanel()");
        if (this.destroyed) {
            return;
        }
        const features = this.selection.features();
        if (features.length === 1) {
            log.debug("1 feature");
            const feature = features[0];
            log.debug("updateTwitterPanel()", feature);
            if (feature.properties.count > 0) {
                log.debug("Count > 0");
                log.debug(`this.activePolyLayerShortName=${this.activeRegionType}`);
                this.tweets = await this.data.tweets(this.activeLayerGroup, this.activeRegionType, this.selection.regionNames(),
                                                     this._dateMin,
                                                     this._dateMax);
                log.debug(this.tweets);
                this.twitterPanelHeader = true;
                this.showTwitterTimeline = true;
                this.showTweets();
            } else {
                log.debug(`Count == ${feature.properties.count}`);
                this.twitterPanelHeader = true;
                this.showTwitterTimeline = false;
                this.tweets = [];
            }
        } else if (features.length === 0) {
            log.debug("0 features");
            this.showTwitterTimeline = false;
            this.tweets = [];
            this.hideTweets();
        } else {
            log.debug(features.length + " features");
            this.tweets = await this.data.tweets(this.activeLayerGroup, this.activeRegionType, this.selection.regionNames(), this._dateMin,
                                                 this._dateMax);
            log.debug(this.tweets);
            this.twitterPanelHeader = true;
            this.showTwitterTimeline = true;
        }


    }

    /**
     * Mouse out event.
     */
    private featureLeft(e: LeafletMouseEvent) {
        log.debug("featureLeft(" + this._activeStatistic + ")");
        if (this.destroyed) {
            return;
        }
        if (this.selection.isSelected(e.target.feature)) {
            this.highlight(e.target);
        } else {
            this.unhighlight(e.target);
        }

        this._inFeature = false;
    }

    private isMultiSelect(e: LeafletMouseEvent) {
        return (getOS() === "Mac OS" && e.originalEvent.metaKey) || (getOS() !== "Mac OS" && e.originalEvent.ctrlKey);
    }

    /**
     * Mouse click event.
     */
    private async featureClicked(e: LeafletMouseEvent) {
        log.debug("featureClicked()");
        log.debug(e.target.feature.properties.name);
        if (this.destroyed) {
            return;
        }
        if (this.isMultiSelect(e)) {
            this.selection.toggle(e.target.feature);
        } else {
            this._geojson[this.activeStatistic].resetStyle(e.propagatedFrom);
            this.selection.selectOnly(e.target.feature);
        }
        await this.updateSearch({selected: this.selection.regionNames()});
        this.selectedFeatureNames = this.selection.regionNames();
        await this.updateTwitterPanel();
        if (this.selection.isSelected(e.target.feature)) {
            this.highlight(e.target, 3);
        } else {
            this.highlight(e.target);
        }

    }

    private onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: GeoJSON) {
        log.verbose("onEachFeature()");
        if (this.destroyed) {
            return;
        }
        // If this feature is referenced in the URL query parameters selected
        // e.g. ?...&selected=powys&selected=armagh
        // then highlight it and update Twitter
        if (this._selectedFeatureNames.includes(feature.properties.name)) {
            log.verbose("Matched " + feature.properties.name);

            this.highlight(layer, 3);

            this.selection.select(feature as Feature);
            this._twitterIsStale = true;
            this.showTweets();
        }

        // this.ngZone.run(...) is called because the event handler takes place outside of angular.
        // But we need all of angulars property change detection etc. to happen.
        const mc = this;
        layer.on({
                     mouseover: (e) => this._zone.run(() => mc.featureEntered(e)),
                     mouseout:  (e) => this._zone.run(() => mc.featureLeft(e)),
                     click:     (e) => this._zone.run(() => mc.featureClicked(e))
                 });
    }

    /**
     * Clears and iialises feature data on the map.
     */
    private async clearMapFeatures() {

    }

    /**
     * Reset the polygon layers.
     *
     * @param clearSelected clears the selected polygon
     */
    private async resetStatisticsLayer(layer: string, clearSelected) {
        if (this.destroyed) {
            return;
        }

        log.info("Resetting " + layer);
        // this.loading.showIndeterminateSpinner();
        try {
            const geography: PolygonData = await this.data.geoJsonGeographyFor(this.activeRegionType) as PolygonData;
            log.debug("resetStatisticsLayer(" + clearSelected + ")");
            // this.hideTweets();
            log.debug(layer);
            const curLayerGroup = layerGroup();
            if (curLayerGroup != null) {

                // noinspection JSUnfilteredForInLoop
                await this.data.recentTweets(this.activeLayerGroup, this.activeRegionType).then(async regionTweetMap => {
                    log.debug("Region Tweet Map", regionTweetMap);

                    const styleFunc = (feature: geojson.Feature) => {
                        log.verbose("styleFunc " + layer);

                        const style = this._color.colorFunctions[layer].getFeatureStyle(
                            feature);
                        log.verbose("Style ", style, feature.properties);
                        if (this.liveUpdating && regionTweetMap[feature.properties.name]) {
                            log.verbose(`Adding new tweet style for ${feature.properties.name}`);
                            style.className = style.className + " leaflet-new-tweet";
                        }
                        return style;

                    };
                    await this.updateRegionData(geography);
                    this._geojson[layer] = new GeoJSON(
                        geography as geojson.GeoJsonObject, {
                            style:         styleFunc,
                            onEachFeature: (f, l) => this.onEachFeature(f, l as GeoJSON)
                        }).addTo(curLayerGroup);

                }).catch(e => log.error(e));


            } else {
                log.debug("Null layer " + layer);
            }
            if (clearSelected) {
                this.selection.clear();
                this.hideTweets();
            }
            this.currentStatisticsLayer.clearLayers();
            this._map.removeLayer(this.currentStatisticsLayer);
            this._map.addLayer(curLayerGroup);
            this.currentStatisticsLayer = curLayerGroup;
        } catch (e) {
            console.error(e);
        } finally {
            // this.loading.hideIndeterminateSpinner();
        }

    }

    /**
     * Updates the data stored in the polygon data of the leaflet layers.
     */
    private async updateRegionData(geography: PolygonData) {
        if (this.destroyed) {
            return;
        }
        return new Promise<void>(async (resolve, reject) => {
            log.debug("Loading stats");
            const features = geography.features;
            log.debug("Before stats");
            const statsMap = await this.data.getRegionStatsMap(this.activeLayerGroup, this.activeRegionType, this._dateMin, this._dateMax);
            log.debug("After stats");
            for (const feature of features) {
                const featureProperties = feature.properties;
                const region = featureProperties.name;
                const regionStats = statsMap[region];
                if (regionStats) {
                    featureProperties.count = regionStats.count;
                    featureProperties.stats = regionStats.exceedance;
                } else {
                    log.verbose("No data for " + region);
                    featureProperties.count = 0;
                    featureProperties.stats = 0;
                }
                if (feature === features[features.length - 1]) {
                    resolve();
                }

            }
        });

    }

    private async updateLayers(reason: string = "", clearSelected = false) {
        log.debug("updateLayers()");
        if (this.destroyed) {
            return;
        }
        return await this._exec.queue("Update Layers: " + reason, ["ready"], async () => {
                                          // Mark as stale to trigger a refresh
                                          log.debug("updateLayers() lambda");
                                          if (this.destroyed) {
                                              return;
                                          }
                                          if (!this._updating) {
                                              this.activity = true;
                                              this._updating = true;
                                              try {

                                                  await this.scheduleResetLayers(this.activeStatistic, clearSelected);
                                                  await this.updateTwitterPanel();
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
            , reason, false, true);
    }

    /**
     * Hides the tweet drawer/panel.
     */
    private hideTweets() {
        log.debug("hideTweets()");
        if (this.destroyed) {
            return;
        }
        this._exec.queue("Tweets Visible", ["ready"], () => {
            this.tweetsVisible = false;
        }, "tweets.visibility", true, true, true);
    }

    /**
     * Reveals the tweet drawer/panel.
     */
    private showTweets() {
        log.verbose("showTweets()");
        if (this.destroyed) {
            return;
        }
        this._exec.queue("Tweets Visible", ["ready"], () => {
            this.tweetsVisible = true;
        }, "tweets.visibility", true, true, true);
    }

    /**
     * This is called if this._sliderIsStale === true;
     */
    private async updateFromSlider() {
        log.debug("updateFromSlider()");
        log.debug("updateFromSlider() startMax=" + this.sliderOptions.startMax);
        log.debug(
            "updateFromSlider() threshold=" + (await this.data.now() - this.pref.combined.continuousUpdateThresholdInMinutes * 60_000));
        if (this.destroyed) {
            return;
        }
        this.liveUpdating = this.sliderOptions.startMax >= await this.data.now() - this.pref.combined.continuousUpdateThresholdInMinutes * 60_000;

        await this.checkForLiveUpdating();
        await this.updateLayers("Slider Change");
        this._twitterIsStale = true;
    }

    /**
     * Update the date slider after a data update from the server.
     */
    private async updateSliderFromData() {
        log.debug("updateSliderFromData()");
        if (this.destroyed) {
            return;
        }
        this._absoluteTime = (await this.data.now());

        this.sliderOptions = {
            ...this.sliderOptions,
            max: await this.data.now(),
            min: await this.data.minDate() - 60 * 1000,
        };
        await this.checkForLiveUpdating();

    }

    private async checkForLiveUpdating() {
        log.debug("checkForLiveUpdating()");
        if (this.destroyed) {
            return;
        }
        if (this.sliderOptions.startMax >= await this.data.now() - this.pref.combined.continuousUpdateThresholdInMinutes * 60_000) {
            this.liveUpdating = true;
        } else {
            log.debug("LIVE UPDATES OFF: slider position was ", this.sliderOptions.startMax);
        }
        if (this.liveUpdating) {
            log.debug("LIVE UPDATES ON");
            this._dateMax = roundToMinute(await this.data.now());
            this.sliderOptions.startMax = roundToMinute(await this.data.now());
        }
    }

    /**
     * Update the twitter panel using the currently selected feature.
     *
     */
    private async updateTwitter() {
        log.debug("updateTwitter()");
        if (this.destroyed) {
            return;
        }
        await this._exec.queue("Update Twitter", ["ready"], async () => {
            // noinspection ES6MissingAwait
            this.updateTwitterPanel();
        }, "", false, true, true, null, 1000, 5);
    }
}
