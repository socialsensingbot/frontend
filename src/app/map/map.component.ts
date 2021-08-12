import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {Browser, GeoJSON, latLng, Layer, LayerGroup, layerGroup, LeafletMouseEvent, Map, tileLayer} from "leaflet";
import "jquery-ui/ui/widgets/slider.js";
import {ActivatedRoute, NavigationStart, Params, Router} from "@angular/router";
import * as rxjs from "rxjs";
import {Subscription, timer} from "rxjs";
import * as geojson from "geojson";
import {DateRange, DateRangeSliderOptions} from "./date-range-slider/date-range-slider.component";
import {LayerStyleService} from "./services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {
    COUNTY,
    Feature,
    NumberLayers,
    NumberLayerShortName,
    numberLayerShortNames,
    PolygonData,
    PolyLayers,
    STATS
} from "./types";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService, AppState} from "../services/uiexecution.service";
import {ColorCodeService} from "./services/color-code.service";
import {Tweet} from "./twitter/tweet";
import {getOS, toTitleCase} from "../common";
import {RegionSelection} from "./region-selection";
import {PreferenceService} from "../pref/preference.service";
import {NgForageCache} from "ngforage";
import {environment} from "../../environments/environment";
import Auth from "@aws-amplify/auth";
import {FormControl} from "@angular/forms";
import {DashboardService} from "../pref/dashboard.service";
import {LoadingProgressService} from "../services/loading-progress.service";
import {ONE_DAY, RegionGeography} from "./data/map-data";
import {RESTMapDataService} from "./data/rest-map-data.service";


const log = new Logger("map");

const ONE_MINUTE_IN_MILLIS = 60000;

@Component({
               selector:    "app-map",
               templateUrl: "./map.component.html",
               styleUrls:   ["./map.component.scss"]
           })
export class MapComponent implements OnInit, OnDestroy {
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
    private _numberLayers: NumberLayers = {stats: null, count: null};
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
    public selectedCountriesTextValue: string = "";

    constructor(private _router: Router,
                private route: ActivatedRoute,
                private _zone: NgZone,
                private _layerStyles: LayerStyleService,
                private _notify: NotificationService,
                private _auth: AuthService,
                private _http: HttpClient,
                private _exec: UIExecutionService,
                private _color: ColorCodeService,
                public data: RESTMapDataService,
                public pref: PreferenceService,
                private readonly cache: NgForageCache,
                public dash: DashboardService,
                public loading: LoadingProgressService
    ) {
        // save the query parameter observable
        this._searchParams = this.route.queryParams;


    }

    private _activeLayerGroup: string = this.DEFAULT_LAYER_GROUP;

    public get activeLayerGroup(): string {
        return this._activeLayerGroup;
    }

    public set activeLayerGroup(value: string) {
        log.debug("set activeLayerGroup");
        this._activeLayerGroup = value;
        this._twitterIsStale = true;
        this.ready = false;
        this.load();
    }

    private _dataset: string;

    public get dataset(): string {
        return this._dataset;
    }

    public set dataset(value: string) {
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
                    this.updateSearch({zoom, lng, lat, selected: null});
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

    private _activeStatistic: NumberLayerShortName;

    public get activeStatistic(): NumberLayerShortName {
        return this._activeStatistic;
    }

    public set activeStatistic(value: NumberLayerShortName) {
        log.debug("set activeStatistic");
        if (this._activeStatistic !== value) {
            this._activeStatistic = value;
            this.updateSearch({active_number: this._activeStatistic});
            if (this._map) {
                for (const layer in this._numberLayers) {
                    if (layer !== value) {
                        log.debug("Removing " + layer);
                        this._map.removeLayer(this._numberLayers[layer]);
                    }
                }
                for (const layer in this._numberLayers) {
                    if (layer === value) {
                        log.debug("Adding " + layer);
                        this._map.addLayer(this._numberLayers[layer]);

                    }
                }
            }
            this.scheduleResetLayers(false);
        }
    }

    private _activeRegionType: string;

    public get activeRegionType(): string {
        return this._activeRegionType;
    }

    public set activeRegionType(value: string) {
        log.debug("activeRegionType(" + value + ")");

        if (this.activeRegionType !== value) {
            if (!this.activeRegionType) {
                this.updateSearch({active_polygon: value});
            } else {
                log.debug("Removing selected region(s) as we have changed region type");
                this.updateSearch({active_polygon: value, selected: null});
            }
            if (this._map) {
                for (const layer in this._polyLayers) {
                    if (layer !== value) {
                        log.debug("Removing " + layer);
                        this._map.removeLayer(this._polyLayers[layer]);
                    }
                }
                for (const layer in this._polyLayers) {
                    if (layer === value) {
                        log.debug("Adding " + layer);
                        this._map.addLayer(this._polyLayers[layer]);

                    }
                }
            }
            this._activeRegionType = value;
            this.scheduleResetLayers();
        }


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
        return this._exec.queue("Update URL Query Params", ["ready", "data-refresh"], async () => {
            const keys = {...this._newParams, ...params};
            this._newParams = {};
            Object.keys(keys).sort().forEach((key) => {
                this._newParams[key] = keys[key];
            });
            await this._router.navigate([], {
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


        // Avoids race condition with access to this.pref.combined
        await this.pref.waitUntilReady();
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
        if (this._loadTimer) {
            this._loadTimer.unsubscribe();
        }
        if (this._twitterUpdateTimer) {
            this._twitterUpdateTimer.unsubscribe();
        }
        if (this._sliderUpdateTimer) {
            this._sliderUpdateTimer.unsubscribe();
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
        log.debug("Destroyed");

    }

    /**
     * Read the live.json data file and process contents.
     */
    async load(first: boolean = false, clearSelected = false) {
        log.debug("load(" + first + "," + clearSelected + ")");
        if (!first && this._updating) {
            log.info("UI is busy so skipping load");
            setTimeout(() => {
                this._zone.run(() => this.load());
            }, 2000);
            return;
        }
        log.debug(`load(${first})`);
        if (!this._loggedIn) {
            log.warn("User logged out, not performing load.");
            return;
        }

        try {

            await this.data.load(first);

            if (first) {
                this._exec.changeState("no-params");
                await this.updateSliderFromData();
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

    }

    /**
     * Triggered by a change to the date range slider.
     *
     * @see DateRangeSliderComponent
     * @param range the user selected upper and lower date range.
     */
    public sliderChange(range: DateRange) {
        // tslint:disable-next-line:prefer-const
        let {lower, upper} = range;
        log.debug("sliderChange(" + lower + "->" + upper + ")");
        this._dateMax = upper;
        this._dateMin = lower;
        this.sliderOptions.startMin = lower;
        this.sliderOptions.startMax = upper;

        this.updateSearch({min_time: this._dateMin, max_time: this._dateMax});
        if (this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }

    }

    // public downloadAggregateAsCSV(aggregrationSetId: string, id: string, $event: MouseEvent) {
    //     // this.data.downloadAggregate(aggregrationSetId, id,
    //     //                             this.activePolyLayerShortName,

    /**
     * Triggered when the user has finished sliding the slider.
     */
    public sliderChangeOnEnd(range: DateRange) {
        log.info("sliderChangeOnEnd()", range);
        if (!this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }


    }

    public downloadTweetsAsCSV() {
        log.debug("downloadTweetsAsCSV()");
        if (this.data.hasCountryAggregates()) {
            this.data.downloadAggregate("countries", this.selectedCountries,
                                        this.activeRegionType,
                                        this.data.regionGeography[this.activeRegionType] as PolygonData, this._dateMin,
                                        this._dateMax);
        } else {
            this.data.download(this.data.regionGeography[this.activeRegionType] as PolygonData, this.activeRegionType,
                               this._dateMin, this._dateMax);
        }
    }

    public zoomIn() {
        log.debug("zoomIn()");
        if (this._map.getZoom() < 18) {
            this._map.setZoom(this._map.getZoom() + 1);
        } else {
            this._notify.show("Maximum Zoom");
        }
    }

    public zoomOut() {
        log.debug("zoomOut()");
        if (this._map.getZoom() > 2) {
            this._map.setZoom(this._map.getZoom() - 1);
        } else {
            this._notify.show("Minimum Zoom");
        }
    }

    public calculateSelectedCountriesText() {
        log.debug("selectedCountriesText()");
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

    private scheduleResetLayers(clearSelected = true) {
        log.debug("scheduleResetLayers()");
        return this._exec.queue("Reset Layers", ["ready"], () => {
            this.activity = true;
            this.resetLayers(clearSelected);
            this.activity = false;
        }, "", false, true, true);
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
            layer_group
        } = params;
        this._newParams = params;
        this._absoluteTime = this.data.lastEntryDate().getTime();
        this.sliderOptions.min = this.data.minDate();
        // These handle the date slider min_time & max_time values
        if (typeof min_time !== "undefined") {
            this._dateMin = +min_time;
        } else {
            this._dateMin = Date.now() - (ONE_DAY);
        }
        this.sliderOptions = {
            ...this.sliderOptions,
            startMin: this._dateMin
        };
        if (typeof max_time !== "undefined") {
            this._dateMax = +max_time;
        } else {
            this._dateMax = this.data.now();
        }
        this.sliderOptions = {...this.sliderOptions, startMax: this._dateMax};
        if (typeof layer_group !== "undefined") {
            this._activeLayerGroup = layer_group;
        }

        this.checkForLiveUpdating();
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
                this._selectedFeatureNames = selected;
            } else {
                this._selectedFeatureNames = [selected];
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
        map.addEventListener("click", event => {
            this._zone.run(args => {
                if (!this._inFeature) {
                    this.clearSelectedRegions();
                }
            });
        });
        this.dash.init();
        if (this.route.snapshot.queryParamMap.has("__clear_cache__")) {
            this.cache.clear();
        }
        log.debug("init");
        // map.zoomControl.remove();
        await this.pref.waitUntilReady();
        this.activity = true;
        if (this.route.snapshot.paramMap.has("dataset")) {
            this._dataset = this.route.snapshot.paramMap.get("dataset");
        } else {
            this._dataset = this.pref.combined.defaultDataSet;
        }
        await this.data.init(this.dataset);
        if (this.route.snapshot.queryParamMap.has("layer_group")) {
            this._activeLayerGroup = this.route.snapshot.queryParamMap.get("layer_group");
        } else {
            this._activeLayerGroup = this.data.mapMetadata.defaultLayerGroup;
        }
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

        // define the layers for the different counts
        this._numberLayers.stats = layerGroup().addTo(map);
        this._numberLayers.count = layerGroup();

        // layers for the different polygons
        this._polyLayers.county = layerGroup().addTo(map);
        this._polyLayers.coarse = layerGroup();
        this._polyLayers.fine = layerGroup();


        this._loggedIn = await Auth.currentAuthenticatedUser() != null;

        this._exec.changeState("map-init");
        await this.load(true);
        this.loading.loaded();
        this.checkForLiveUpdating();
        this._searchParams.subscribe(async params => {

            if (!this._params) {
                this._params = true;
                this._exec.queue("Initial Search Params", ["no-params"],
                                 async () => {
                                     this.updateMapFromQueryParams(params);

                                     // Listeners to push map state into URL
                                     map.addEventListener("dragend", () => {
                                         return this._zone.run(
                                             () => this.updateSearch(
                                                 {lat: this._map.getCenter().lat, lng: this._map.getCenter().lng}));
                                     });

                                     map.addEventListener("zoomend", (event) => {
                                         return this._zone.run(() => this.updateSearch({zoom: this._map.getZoom()}));
                                     });

                                     this._exec.changeState("ready");
                                     this.updateLayers("From Parameters");
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
                                 });
            } else {
                if (this._popState) {
                    log.debug("POP STATE detected before URL query params change.");
                    this._popState = false;
                    this.activity = true;
                    await this.updateMapFromQueryParams(params);
                    await this.resetLayers(true);
                    return this.updateLayers("Pop State")
                               .then(() => this._twitterIsStale = true)
                               .finally(() => this.activity = false);
                }
            }

        });
        log.debug("Init completed successfully");

    }

    private async clearSelectedRegions() {
        log.debug("clearSelectedRegions()");

        await this.updateSearch({selected: []});
        this._selectedFeatureNames = [];
        await this.resetLayers(true);
    }

    /**
     * When the user places their mouse over a feature (region) this is called.
     */
    private featureEntered(e: LeafletMouseEvent) {
        const feature = e.target.feature;
        const exceedanceProbability: number = Math.round(feature.properties.stats * 100) / 100;
        const region: string = toTitleCase(feature.properties.name);
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
        log.debug("Highlighting ", target.feature);
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
        log.debug("Un-highlighting ", target.feature);
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
        const features = this.selection.features();
        if (features.length === 1) {
            log.debug("1 feature");
            const feature = features[0];
            log.debug("updateTwitterPanel()", feature);
            if (feature.properties.count > 0) {
                log.debug("Count > 0");
                log.debug(`this.activePolyLayerShortName=${this.activeRegionType}`);
                this.tweets = await this.data.tweets(this.activeRegionType, this.selection.regionNames(), this._dateMin,
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
            this.tweets = await this.data.tweets(this.activeRegionType, this.selection.regionNames(), this._dateMin, this._dateMax);
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
        if (this.selection.isSelected(e.target.feature)) {
            this.highlight(e.target);
        } else {
            this.unhighlight(e.target);
        }

        this._inFeature = false;
    }

    /**
     * Mouse click event.
     */
    private featureClicked(e: LeafletMouseEvent) {
        log.debug("featureClicked()");
        log.debug(e.target.feature.properties.name);
        if (this.isMultiSelect(e)) {
            this.selection.toggle(e.target.feature);
        } else {
            this._geojson[this.activeStatistic].resetStyle(e.propagatedFrom);
            this.selection.selectOnly(e.target.feature);
        }
        this.updateSearch({selected: this.selection.regionNames()});
        this._selectedFeatureNames = this.selection.regionNames();
        this.updateTwitterPanel();
        if (this.selection.isSelected(e.target.feature)) {
            this.highlight(e.target, 3);
        } else {
            this.highlight(e.target);
        }

    }

    private isMultiSelect(e: LeafletMouseEvent) {
        return (getOS() === "Mac OS" && e.originalEvent.metaKey) || (getOS() !== "Mac OS" && e.originalEvent.ctrlKey);
    }

    private onEachFeature(feature: geojson.Feature<geojson.GeometryObject, any>, layer: GeoJSON) {
        log.verbose("onEachFeature()");

        // If this feature is referenced in the URL query parameters selected
        // e.g. ?...&selected=powys&selected=armagh
        // then highlight it and update Twitter
        if (this._selectedFeatureNames.includes(feature.properties.name)) {
            log.debug("Matched " + feature.properties.name);

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
     * Reset the polygon layers.
     *
     * @param clearSelected clears the selected polygon
     */
    private async resetLayers(clearSelected) {
        const geography: PolygonData = await this.data.geoJsonGeographyFor(this.activeRegionType) as PolygonData;
        log.debug("resetLayers(" + clearSelected + ")");
        // this.hideTweets();
        for (const key of numberLayerShortNames) {
            log.debug(key);
            const curLayerGroup = this._numberLayers[key];
            if (curLayerGroup != null) {
                // noinspection JSUnfilteredForInLoop
                curLayerGroup.clearLayers();

                // noinspection JSUnfilteredForInLoop
                const shortNumberLayerName = key;
                const regionTweetMap = await this.data.recentTweets(this.activeRegionType);
                log.debug("Region Tweet Map", regionTweetMap);

                const styleFunc = (feature: geojson.Feature) => {

                    const style = this._color.colorFunctions[shortNumberLayerName].getFeatureStyle(
                        feature);
                    console.log("Style ", style, feature.properties);
                    if (this.liveUpdating && regionTweetMap[feature.properties.name]) {
                        log.debug(`Adding new tweet style for ${feature.properties.name}`);
                        style.className = style.className + " leaflet-new-tweet";
                    }
                    return style;

                };
                await this.updateRegionData(geography);

                this._geojson[shortNumberLayerName] = new GeoJSON(
                    geography as geojson.GeoJsonObject, {
                        style:         styleFunc,
                        onEachFeature: (f, l) => this.onEachFeature(f, l as GeoJSON)
                    }).addTo(curLayerGroup);
            } else {
                log.debug("Null layer " + key);
            }
            if (clearSelected) {
                this.selection.clear();
                this.hideTweets();
            }
        }
    }

    /**
     * Clears and iialises feature data on the map.
     */
    private async clearMapFeatures() {

    }

    /**
     * Updates the data stored in the polygon data of the leaflet layers.
     */
    private async updateRegionData(regionData: PolygonData) {
        const features = regionData.features;
        for (const feature of features) {
            const featureProperties = feature.properties;
            const region = featureProperties.name;
            const mapStats = await this.data.regionStats(this.activeRegionType, region, this._dateMin, this._dateMax);
            if (mapStats !== null) {
                featureProperties.count = mapStats.count;
                featureProperties.stats = mapStats.exceedance;
            } else {
                log.debug("No data for " + region);
                featureProperties.count = 0;
                featureProperties.stats = 0;
            }
        }
    }

    private async updateLayers(reason: string = "", clearSelected = false) {
        log.debug("updateLayers()");
        return this._exec.queue("Update Layers: " + reason, ["ready"], async () => {
                                    // Mark as stale to trigger a refresh
                                    log.debug("updateLayers() lambda");
                                    if (!this._updating) {
                                        this.activity = true;
                                        this._updating = true;
                                        try {

                                            await this.clearMapFeatures();
                                            await this.resetLayers(clearSelected);
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
     * This is called if this._sliderIsStale === true;
     */
    private async updateFromSlider() {
        log.debug("updateFromSlider()");
        this.liveUpdating = this.sliderOptions.startMax > -this.pref.combined.continuousUpdateThresholdInMinutes;

        this.checkForLiveUpdating();
        await this.updateLayers("Slider Change");
        this._twitterIsStale = true;
    }

    /**
     * Update the date slider after a data update from the server.
     */
    private async updateSliderFromData() {
        log.debug("updateSliderFromData()");
        this._absoluteTime = this.data.lastEntryDate().getTime();

        this.sliderOptions = {
            ...this.sliderOptions,
            max: this.data.now(),
            min: this.data.minDate() - 60 * 1000,
        };
        this.checkForLiveUpdating();

    }

    private checkForLiveUpdating() {
        log.debug("checkForLiveUpdating()");
        if (this.sliderOptions.startMax > -this.pref.combined.continuousUpdateThresholdInMinutes) {
            this.liveUpdating = true;
        } else {
            log.debug("LIVE UPDATES OFF: slider position was ", this.sliderOptions.startMax);
        }
        if (this.liveUpdating) {
            log.debug("LIVE UPDATES ON");
            this._dateMax = this._absoluteTime;
            this.sliderOptions.startMax = this.data.now();
        }
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
        }, "", false, true, true);
    }

    public async timeSliderPreset(mins: number) {
        log.debug("timeSliderPreset()");
        await this.sliderChange({lower: this.data.now() - mins * ONE_MINUTE_IN_MILLIS, upper: this.data.now()});
        this.sliderOptions = {
            max:      this.data.now(),
            min:      this.data.minDate(),
            startMin: this.data.now() - mins * ONE_MINUTE_IN_MILLIS,
            startMax: this.data.now()
        };
        this._sliderIsStale = true;
    }
}
