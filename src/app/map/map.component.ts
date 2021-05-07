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
import {
    COUNTY,
    Feature,
    NumberLayers,
    NumberLayerShortName,
    numberLayerShortNames,
    PolygonData,
    PolyLayers,
    Properties,
    STATS
} from "./types";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService, UIState} from "../services/uiexecution.service";
import {ColorCodeService} from "./services/color-code.service";
import {MapDataService} from "./data/map-data.service";
import {ProcessedPolygonData} from "./data/processed-data";
import {Tweet} from "./twitter/tweet";
import {getOS, toTitleCase} from "../common";
import {RegionSelection} from "./region-selection";
import {PreferenceService} from "../pref/preference.service";
import {NgForageCache} from "ngforage";
import {environment} from "../../environments/environment";
import Auth from "@aws-amplify/auth";
import {FormControl} from "@angular/forms";


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
        max:      0,
        min:      -24 * 60 + 1,
        startMin: -24 * 60 + 1,
        startMax: 0
    };
    public selection = new RegionSelection();
    public showTwitterTimeline: boolean;
    _routerStateChangeSub: Subscription;
    _popState: boolean;
    public countries: FormControl = new FormControl();
    public selectedCountries: string[] = [];
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

    constructor(private _router: Router,
                private route: ActivatedRoute,
                private _zone: NgZone,
                private _layerStyles: LayerStyleService,
                private _notify: NotificationService,
                private _auth: AuthService,
                private _http: HttpClient,
                private _exec: UIExecutionService,
                private _color: ColorCodeService,
                public data: MapDataService,
                public pref: PreferenceService,
                private readonly cache: NgForageCache,
    ) {
        // save the query parameter observable
        this._searchParams = this.route.queryParams;


    }

    private _dataset: string;

    public get dataset(): string {
        return this._dataset;
    }

    public set dataset(value: string) {
        if (value && value !== this._dataset) {
            this.activity = true;
            this._updating = true;
            this.ready = false;
            this._dataset = value;
            this._router.navigate(["/map", value], {queryParams: this._newParams, queryParamsHandling: "merge"});
            const oldLocation = this.data.dataSetMetdata.location;
            this.data.switchDataSet(value).then(async () => {
                this.hideTweets();
                await this.data.loadStats();
                await this.data.loadAggregations();
                log.debug(`Old location ${oldLocation} new location ${this.data.dataSetMetdata.location}`);
                if (this.data.dataSetMetdata.location !== oldLocation) {
                    this.selection.clear();
                    const {zoom, lng, lat} = {
                        ...this.data.serviceMetadata.start,
                        ...this.data.dataSetMetdata.start,
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

    private _activeNumberLayerShortName: NumberLayerShortName;

    public get activeNumberLayerShortName(): NumberLayerShortName {
        return this._activeNumberLayerShortName;
    }

    public set activeNumberLayerShortName(value: NumberLayerShortName) {
        if (this._activeNumberLayerShortName !== value) {
            this._activeNumberLayerShortName = value;
            this.updateSearch({active_number: this._activeNumberLayerShortName});
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
            this.scheduleResetLayers();
        }
    }

    private _activePolyLayerShortName: string;

    public get activePolyLayerShortName(): string {
        return this._activePolyLayerShortName;
    }

    public set activePolyLayerShortName(value: string) {
        log.debug("New baselayer " + value);

        if (this.activePolyLayerShortName !== value) {
            if (!this.activePolyLayerShortName) {
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
            this._activePolyLayerShortName = value;
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

        this._exec.start();

        this._stateSub = this._exec.state.subscribe((state: UIState) => {
            if (state === "ready") {
                this.ready = true;
            }
        });

        let twitterUpdateInProgress = false;
        this._twitterUpdateTimer = timer(0, 1000).subscribe(async () => {
            if (!twitterUpdateInProgress) {
                if (this._twitterIsStale) {
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
                    sliderUpdateInProgress = true;
                    this._sliderIsStale = false;
                    await this.updateFromSlider();
                    sliderUpdateInProgress = false;
                }
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
                                             if (event.navigationTrigger === "popstate") {
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
        if (this._sliderUpdateTimer) {
            this._sliderUpdateTimer.unsubscribe();
        }
        if (this._stateSub) {
            this._stateSub.unsubscribe();
        }
        if (this._routerStateChangeSub) {
            this._routerStateChangeSub.unsubscribe();
        }

    }

    /**
     * Read the live.json data file and process contents.
     */
    async load(first: boolean = false, clearSelected = false) {
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
            await this.data.load();

            if (first) {
                await this._exec.queue("Update Slider", ["data-loaded"],
                                       () => {this.updateSliderFromData(); });
                this._exec.changeState("no-params");
            } else {
                await this.updateLayers("Data Load", clearSelected);
                await this._exec.queue("Update Slider", ["ready", "data-refresh"],
                                       () => {this.updateSliderFromData(); }, null, true, true, true);
            }

            this._twitterIsStale = true;

        } catch (e) {
            this._exec.changeState("data-load-failed");
            console.error(e);
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
        const {lower, upper} = range;
        log.debug("sliderChange(" + lower + "->" + upper + ")");
        this._dateMax = this.data.entryDate(upper).getTime();
        this._dateMin = this.data.entryDate(lower).getTime();
        this.updateSearch({min_time: this._dateMin, max_time: this._dateMax});
        if (this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }

    }

    /**
     * Triggered when the user has finished sliding the slider.
     */
    public sliderChangeOnEnd($event: any) {
        log.debug("sliderChangeOnEnd()");
        if (!this.pref.combined.animateOnTimeSliderChange) {
            this._sliderIsStale = true;
        }
    }

    public downloadTweetsAsCSV() {
        this.data.downloadAggregate("countries", this.selectedCountries,
                                    this.activePolyLayerShortName,
                                    this.data.polygonData[this.activePolyLayerShortName] as PolygonData);
    }

    // public downloadAggregateAsCSV(aggregrationSetId: string, id: string, $event: MouseEvent) {
    //     // this.data.downloadAggregate(aggregrationSetId, id,
    //     //                             this.activePolyLayerShortName,
    //     //                             this.data.polygonData[this.activePolyLayerShortName] as PolygonData);
    // }

    public zoomIn() {
        if (this._map.getZoom() < 18) {
            this._map.setZoom(this._map.getZoom() + 1);
        } else {
            this._notify.show("Maximum Zoom");
        }
    }

    public zoomOut() {
        if (this._map.getZoom() > 2) {
            this._map.setZoom(this._map.getZoom() - 1);
        } else {
            this._notify.show("Minimum Zoom");
        }
    }

    public selectedCountriesText() {
        // log.info("selectedCountriesText()");
        // log.info(countries.value);
        if (!this.countries.value || this.countries.value.length === 0) {
            console.log("None");
            return "Download none";
        } else {
            const countryCount = this.countries.value.length;
            const countryData = this.data.aggregations.countries.aggregates;
            if (countryData.length === countryCount) {
                return "Download all";
            } else {
                if (countryCount === 1) {
                    const countryTitle = countryData.filter(
                        i => i.id === this.countries.value[0])[0].title;
                    return `Download ${countryTitle}`;
                } else {
                    return `Download ${countryCount} countries`;
                }
            }
        }
    }

    private scheduleResetLayers() {
        return this._exec.queue("Reset Layers", ["ready", "data-loaded"], () => {
            this.activity = true;
            this.resetLayers(true);
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
            lng, lat, zoom, active_number, active_polygon, selected, min_time, max_time, min_offset, max_offset
        } = params;
        this._newParams = params;
        this._absoluteTime = this.data.lastEntryDate().getTime();
        this.sliderOptions.min = -this.data.entryCount() + 1;
        // These handle the date slider min_time & max_time values
        if (typeof min_time !== "undefined") {
            this._dateMin = +min_time;
            this.sliderOptions = {
                ...this.sliderOptions,
                startMin: this.data.offset(this._dateMin)
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
                startMax: this.data.offset(this._dateMax)
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
            viewChange = newZoom !== zoom || viewChange;
            newZoom = zoom;
        }
        if (viewChange) {
            this._map.setView(newCentre, newZoom, {animate: true, duration: 3000});
        }

        // This handles a change to the active_number value
        this.activeNumberLayerShortName = typeof active_number !== "undefined" ? active_number : STATS;


        // This handles a change to the active_polygon value
        this.activePolyLayerShortName = typeof active_polygon !== "undefined" ? active_polygon : COUNTY;


        // If a polygon (region) is selected update Twitter panel.
        if (typeof selected !== "undefined") {
            if (Array.isArray(selected)) {
                this._selectedFeatureNames = selected;
            } else {
                this._selectedFeatureNames = [selected];
            }
        }

        return undefined;
    }

    /**
     * This method does all the heavy lifting and is called when
     * the map is ready and data is loaded.
     * @param map the leaflet.js Map
     */
    private async init(map: Map) {
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
        await this.data.init();
        await this.data.switchDataSet(this.dataset);
        await this.data.loadStats();
        await this.data.loadAggregations();
        this.data.aggregations.countries.aggregates.forEach(i => this.selectedCountries.push(i.id));
        const {zoom, lng, lat} = {
            ...this.data.serviceMetadata.start,
            ...this.data.dataSetMetdata.start,
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
        if (this.pref.combined.showLoadingMessages) {
            this._notify.show("Loading application ...", "OK", 60);
        }
        $("#loading-div").css("opacity", 0.0);
        setTimeout(() => $("#loading-div").remove(), 1000);
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
                                     await this.updateLayers("From Parameters");
                                     // Schedule periodic data loads from the server
                                     this._loadTimer = timer(ONE_MINUTE_IN_MILLIS, ONE_MINUTE_IN_MILLIS)
                                         .subscribe(async () => {
                                             this.activity = true;
                                             await this.load();
                                             this.activity = false;

                                         });
                                     this._notify.dismiss();
                                     $("#loading-div").css("opacity", 0.0);
                                     setTimeout(() => $("#loading-div").remove(), 1000);
                                     this.activity = false;
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


    }

    /**
     * When the user places their mouse over a feature (region) this is called.
     */
    private featureEntered(e: LeafletMouseEvent) {
        log.debug("featureEntered()");
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
                            opacity:     1,
                            dashArray:   "",
                            fillOpacity: count > 0 ? 1.0 : 0.1,
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
                            fillOpacity: count > 0 ? 1.0 : 0.1,
                        });

        if (!Browser.ie && !Browser.opera && !Browser.edge) {
            target.bringToFront();
        }
    }

    /**
     * Update the Twitter panel by updating the properties it reacts to.
     */
    private updateTwitterPanel() {
        log.debug("updateTwitterPanel()");
        const features = this.selection.features();
        if (features.length === 1) {
            log.debug("1 feature");
            const feature = features[0];
            log.debug("updateTwitterPanel()", feature);
            if (feature.properties.count > 0) {
                log.debug("Count > 0");
                log.debug(`this.activePolyLayerShortName=${this.activePolyLayerShortName}`);
                this.tweets = this.data.tweets(this.activePolyLayerShortName, this.selection.regionNames());
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
            this.tweets = this.data.tweets(this.activePolyLayerShortName, this.selection.regionNames());
            log.debug(this.tweets);
            this.twitterPanelHeader = true;
            this.showTwitterTimeline = true;
        }


    }

    /**
     * Mouse out event.
     */
    private featureLeft(e: LeafletMouseEvent) {
        log.debug("featureLeft(" + this._activeNumberLayerShortName + ")");
        if (this.selection.isSelected(e.target.feature)) {
            this.highlight(e.target);
        } else {
            this.unhighlight(e.target);
        }
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
            this._geojson[this.activeNumberLayerShortName].resetStyle(e.propagatedFrom);
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
    private resetLayers(clearSelected) {
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
                const regionTweetMap = this.data.recentTweets(this.activePolyLayerShortName);
                log.debug("Region Tweet Map", regionTweetMap);

                const styleFunc = (feature: geojson.Feature) => {

                    const style = this._color.colorFunctions[shortNumberLayerName].getFeatureStyle(
                        feature);
                    if (regionTweetMap[feature.properties.name]) {
                        log.debug(`Adding style for ${feature.properties.name}`);
                        style.className = style.className + " leaflet-new-tweet";
                    }
                    return style;

                };
                this._geojson[shortNumberLayerName] = new GeoJSON(
                    this.data.polygonData[this.activePolyLayerShortName] as geojson.GeoJsonObject, {
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
    private clearMapFeatures() {
        for (const regionType of this.data.regionTypes()) { // counties, coarse, fine
            const features = (this.data.polygonData[regionType] as PolygonData).features;
            for (const feature of features) {
                const properties = feature.properties;
                const place = properties.name;
                if (place in this.data.places(regionType)) {
                    properties.count = 0;
                    properties.stats = 0;
                }
            }
        }
    }

    /**
     * Updates the data stored in the polygon data of the leaflet layers.
     */
    private updateRegionData() {
        for (const regionType of this.data.regionTypes()) { // counties, coarse, fine
            const regionData: PolygonData = (this.data.polygonData)[regionType] as PolygonData;
            const features: Feature[] = regionData.features;
            for (const feature of features) {
                const featureProperties: Properties = feature.properties;
                const place = featureProperties.name;
                const tweetRegionInfo: ProcessedPolygonData = this.data.regionData(regionType);
                if (tweetRegionInfo.hasPlace(place)) {
                    featureProperties.count = tweetRegionInfo.countForPlace(place);
                    featureProperties.stats = tweetRegionInfo.exceedanceForPlace(place);
                } else {
                    log.verbose("No data for " + place);
                    featureProperties.count = 0;
                    featureProperties.stats = 0;
                }
            }

        }
    }

    private async updateLayers(reason: string = "", clearSelected = false) {
        return this._exec.queue("Update Layers: " + reason, ["ready", "data-loaded", "data-refresh"], async () => {
                                    // Mark as stale to trigger a refresh
                                    if (!this._updating) {
                                        this.activity = true;
                                        this._updating = true;
                                        try {

                                            this._exec.changeState("data-refresh");
                                            await this.data.update(this._dateMin, this._dateMax);
                                            this.clearMapFeatures();
                                            this.updateRegionData();
                                            this.resetLayers(clearSelected);
                                            this.updateTwitterPanel();
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
            , reason, true, true);
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
        await this.updateLayers("Slider Change");
        this._twitterIsStale = true;
    }

    /**
     * Update the date slider after a data update from the server.
     */
    private async updateSliderFromData() {
        log.debug("updateSliderFromData()");
        this._absoluteTime = this.data.lastEntryDate().getTime();
        this._dateMin = Math.max(this._dateMin,
                                 this._absoluteTime - ((this.data.entryCount() - 1) * ONE_MINUTE_IN_MILLIS));
        if (-this.data.offset(this._dateMax) < this.pref.combined.continuousUpdateThresholdInMinutes) {
            log.info(`The slider max (${-this.data.offset(
                this._dateMax)}) offset was less than threshold of ${this.pref.combined.continuousUpdateThresholdInMinutes} for us to keep it at NOW`);
            this._dateMax = Math.max(this._dateMax, this._absoluteTime);
            this.updateSearch({min_time: this._dateMin, max_time: this._dateMax});

        } else {
            this._dateMax = Math.max(this._dateMax,
                                     this._absoluteTime - ((this.data.entryCount() - 1) * ONE_MINUTE_IN_MILLIS));
        }
        this.sliderOptions = {
            max:      0,
            min:      -this.data.entryCount() + 1,
            startMin: this.data.offset(this._dateMin),
            startMax: this.data.offset(this._dateMax)
        };

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
}

