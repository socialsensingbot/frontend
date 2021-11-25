import {Component, NgZone, OnInit} from "@angular/core";
import {GeoJSON, latLng, Layer, layerGroup, LayerGroup, Map, tileLayer} from "leaflet";
import * as rxjs from "rxjs";
import {Subscription} from "rxjs";
import {Tweet} from "../map/twitter/tweet";
import {DateRangeSliderOptions} from "../map/date-range-slider/date-range-slider.component";
import {ONE_DAY, RegionTweeCount} from "../map/data/map-data";
import {RegionSelection} from "../map/region-selection";
import {environment} from "../../environments/environment";
import {PolygonData} from "../map/types";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MapSelectionService} from "../map-selection.service";
import {LayerStyleService} from "../map/services/layer-style.service";
import {NotificationService} from "../services/notification.service";
import {AuthService} from "../auth/auth.service";
import {HttpClient} from "@angular/common/http";
import {AppState, UIExecutionService} from "../services/uiexecution.service";
import {ColorCodeService} from "../map/services/color-code.service";
import {RESTMapDataService} from "../map/data/rest-map-data.service";
import {PreferenceService} from "../pref/preference.service";
import {DashboardService} from "../pref/dashboard.service";
import {LoadingProgressService} from "../services/loading-progress.service";
import Auth from "@aws-amplify/auth";
import * as geojson from "geojson";
import {Logger} from "@aws-amplify/core";
import {DisplayScriptService} from "./display-script.service";
import {DisplayScreen, DisplayScript} from "./types";
import {StatisticType} from "../analytics/timeseries";
import {roundToHour, sleep} from "../common";

const log = new Logger("map");

const ONE_MINUTE_IN_MILLIS = 60000;

@Component({
               selector:    "app-public-display",
               templateUrl: "./public-display.component.html",
               styleUrls:   ["./public-display.component.scss"]
           })
export class PublicDisplayComponent implements OnInit {
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
    public liveUpdating = true;
    //     //                             this.data.polygonData[this.activePolyLayerShortName] as PolygonData);
    public blinkOn = true;
    //     //                             this.activePolyLayerShortName,
    public annotationTypes: any[] = [];
    public countries: any[];
    private displayScript: DisplayScript;
    private _animationTimer: Subscription;
    private currentDisplayScreen: DisplayScreen;
    private currentDisplayNumber = 0;
    private currentStatisticsLayer: LayerGroup<any> = null;
    private destroyed = false;
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
    // URL state management //
    private _geojson: { exceedance: GeoJSON, count: GeoJSON } = {exceedance: null, count: null};
    // ... URL parameters
    public maxDate = 0;
    public minDate = 0;
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
    private _loggedIn: boolean;
    // Timed action triggers //
    private _twitterIsStale = false;
    // Timers for timed actions //
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

    private _selectedFeatureNames: string[] = [];
    private regionTweetMap: RegionTweeCount;
    private _script: string;

    public get selectedFeatureNames(): string[] {
        return this._selectedFeatureNames;
    }

    public set selectedFeatureNames(value: string[]) {
        this._selectedFeatureNames = value;
    }

    private _activeLayerGroup: string = this.DEFAULT_LAYER_GROUP;

    public get activeLayerGroup(): string {
        return this._activeLayerGroup;
    }

    private geographyData: PolygonData;

    private _dataset: string;

    public get dataset(): string {
        return this._dataset;
    }

    public set dataset(value: string) {
        if (this.destroyed) {
            return;
        }
        log.debug("set dataset");
        if (value && value !== this._dataset) {
            this.ready = false;
            this._dataset = value;
            this._router.navigate(["/map", value], {queryParams: this._newParams, queryParamsHandling: "merge"});
            const oldLocation = this.data.mapMetadata.location;
            this.data.switchDataSet(value).then(async () => {
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
                    this._map.setView(latLng([lat, lng]), zoom, {animate: true, duration: 6000});
                }
                this.ready = true;
                await this.load(false);
            }).finally(() => {
            });
        }
    }

    private _activeStatistic: StatisticType;

    public get activeStatistic(): StatisticType {
        return this._activeStatistic;
    }

    public set activeStatistic(value: StatisticType) {
        log.debug("set activeStatistic");
        if (this._activeStatistic !== value) {
            this._activeStatistic = value;
        }
    }

    private _activeRegionType: string;

    public get activeRegionType(): string {
        return this._activeRegionType;
    }

    public set activeLayerGroup(value: string) {
        log.debug("set activeLayerGroup");
        if (value !== this._activeLayerGroup) {
            this._activeLayerGroup = value;
        }
        this._twitterIsStale = true;
        this.updateAnnotationTypes();
        this.load();
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
                public pref: PreferenceService,
                public dash: DashboardService,
                public loading: LoadingProgressService,
                private _display: DisplayScriptService
    ) {

    }

    /**
     * Called when the map element has finished initialising.
     */
    onMapReady(map: Map) {
        log.debug("onMapReady");
        this._map = map;
        this.init(map);
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
                if (timeoutIndex > 10) {  // wait for 2 seconds before giving up
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
    async load(first: boolean = false) {
        if (this.destroyed) {
            return;
        }
        await this.data.load(first);
    }

    public set activeRegionType(value: string) {
        log.debug("activeRegionType(" + value + ")");

        if (this._activeRegionType !== value) {
            this._activeRegionType = value;
        }
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

        // noinspection ES6MissingAwait
        this.dash.init();
        log.debug("init");
        // map.zoomControl.remove();
        await this.pref.waitUntilReady();
        if (this.route.snapshot.paramMap.has("map")) {
            this._dataset = this.route.snapshot.paramMap.get("map");
        } else {
            this._dataset = this.pref.combined.defaultDataSet;
        }

        if (this.route.snapshot.paramMap.has("script")) {
            this._script = this.route.snapshot.paramMap.get("script");
        } else {
            this._script = this.pref.combined.defaultPublicDisplayScript;
        }
        await this.data.init(this.dataset);

        this._loggedIn = await Auth.currentAuthenticatedUser() != null;
        // this.displayScript = this._display.script("county_ex_range_24h_step_1h_win_6h");
        this.displayScript = this._display.script(this._script);
        await this.nextScreen();
        this.loading.loaded();
        this.ready = true;
        let animationLoopCounter = 0;
        let animationStepCounter = 0;
        let completedAnimations = 0;
        await this.resetStatisticsLayer(this.activeStatistic);
        let now: number = await this.data.now();
        let animateFunc: () => Promise<void> = async () => {
            try {
                const animation = this.currentDisplayScreen.animation;
                const stepsPerLoop = Math.round(this.currentDisplayScreen.stepDurationInMilliseconds / 100);
                if (animationLoopCounter % stepsPerLoop === 0) {
                    if (animation.type === "date-animation") {
                        this.minDate = roundToHour(now - animation.startTimeOffsetMilliseconds + (
                            animation.stepDurationInMilliseconds * animationStepCounter
                        ))
                        ;
                        this.maxDate = roundToHour(this.minDate + animation.windowDurationInMilliseconds);
                        log.debug(animationLoopCounter + ": From " + new Date(this.minDate) + " to " + new Date(this.maxDate));
                        animationStepCounter++;
                        if (this.maxDate >= now - animation.endTimeOffsetMilliseconds) {
                            animationStepCounter = 0;
                            now = await this.data.now();
                            completedAnimations++;
                        }
                        await this.load();
                        this.tweets = await this.data.tweets(this.activeLayerGroup, this.activeRegionType,
                                                             await this.data.regionsOfType(this.activeRegionType),
                                                             this.minDate,
                                                             this.maxDate);
                        await this.updateRegionDisplay(this.activeStatistic);
                    }
                }
                animationLoopCounter++;
                if (completedAnimations > this.currentDisplayScreen.animationLoops) {
                    animationLoopCounter = 0;
                    animationStepCounter = 0;
                    completedAnimations = 0;
                    await this.nextScreen();
                }
            } catch (e) {
                log.error(e);
            } finally {
                setTimeout(animateFunc, 100);
            }
        };
        setTimeout(animateFunc, 100);
        // noinspection ES6MissingAwait

        log.debug("Init completed successfully");

    }

    private updateAnnotationTypes(): void {
        log.debug("Finding annotations for layer ", this._activeLayerGroup);
        const currentLayer: any = this.pref.combined.layers.available.filter(i => i.id == this._activeLayerGroup)[0];
        log.debug("Finding annotations for layer ", currentLayer);
        if (currentLayer) {
            const activeAnnotationTypes: any = currentLayer.annotations;
            log.debug("Available annotations are ", activeAnnotationTypes);
            this.annotationTypes = this.pref.combined.annotations.filter(
                i => typeof activeAnnotationTypes === "undefined" || activeAnnotationTypes.includes(i.name));
            log.debug("Annotations are ", this.annotationTypes);
        }
    }

    private async nextScreen() {
        try {
            this.currentDisplayScreen = this.displayScript.screens[this.currentDisplayNumber % this.displayScript.screens.length];
            this.activeLayerGroup = this.currentDisplayScreen.data.layerId;
            this.activeStatistic = this.currentDisplayScreen.data.statistic;
            this.activeRegionType = this.currentDisplayScreen.data.regionType;
            await this.data.loadGeography(this.activeRegionType);
            await this.resetStatisticsLayer(this.activeStatistic);
            this.currentDisplayNumber++;
            return this.currentDisplayScreen;
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Reset the polygon layers.
     *
     * @param clearSelected clears the selected polygon
     */
    private async resetStatisticsLayer(layer: StatisticType) {
        if (this.destroyed) {
            return;
        }

        log.info("Resetting " + layer);
        // this.loading.showIndeterminateSpinner();
        try {
            // this.hideTweets();
            log.debug(layer);
            const curLayerGroup = layerGroup();
            this.geographyData = await this.data.geoJsonGeographyFor(this.activeRegionType) as PolygonData
            this.regionTweetMap = await this.data.recentTweets(this.activeLayerGroup, this.activeRegionType);
            this._geojson[layer] = new GeoJSON(this.geographyData as geojson.GeoJsonObject, {
                style: {
                    className:   "app-map-region-geography",
                    fillColor:   "rgba(100,100,100,0.0)",
                    weight:      1,
                    opacity:     0,
                    color:       "#FFFFFF",
                    dashArray:   "",
                    fillOpacity: 1.0,
                }
            }).addTo(curLayerGroup);
            if (this.currentStatisticsLayer) {
                this._map.removeLayer(this.currentStatisticsLayer);
                this._map.flyTo(latLng([this.currentDisplayScreen.location.lat, this.currentDisplayScreen.location.lon]),
                                this.currentDisplayScreen.location.zoom,
                                {animate: true, duration: this.currentDisplayScreen.location.animationDuration / 1000, easeLinearity: 0.2});
                await sleep(this.currentDisplayScreen.location.animationDuration);

            }
            this._map.addLayer(curLayerGroup);
            this.currentStatisticsLayer = curLayerGroup;
            await this.updateRegionDisplay(layer);
        } catch (e) {
            console.error(e);
        } finally {
            // this.loading.hideIndeterminateSpinner();
        }

    }

    private async updateRegionDisplay(layer: "count" | "exceedance"): Promise<void> {
        if (this.currentStatisticsLayer && this.currentStatisticsLayer.getLayers()[0]) {
            const statsMap = await this.data.getRegionStatsMap(this.activeLayerGroup, this.activeRegionType, this.minDate, this.maxDate);
            let layers: Layer[] = (this.currentStatisticsLayer.getLayers()[0] as GeoJSON).getLayers();
            for (const geoLayer of layers) {
                const feature: any = (geoLayer as GeoJSON).feature;
                const featureProperties = feature.properties;
                const region = featureProperties.name;
                const regionStats = statsMap[region];
                if (regionStats) {
                    featureProperties.count = regionStats.count;
                    featureProperties.exceedance = regionStats.exceedance;
                } else {
                    log.verbose("No data for " + region);
                    featureProperties.count = 0;
                    featureProperties.exceedance = 0;
                }

                const style = this._color.colorFunctions[layer].getFeatureStyle(
                    feature);
                log.verbose("Style ", style, feature.properties);
                const colorData: { colors: string[]; values: number[] } = this._color.colorData[this.activeStatistic];

                let color;
                const d = featureProperties[this.activeStatistic];
                if (d === 0) {
                    color = "rgba(100,100,100,0.1)";
                } else {
                    for (let i = 0; i < colorData.values.length; i++) {
                        if (d > colorData.values[i]) {
                            color = colorData.colors[i];
                            break;
                        }
                    }
                    if (!color) {
                        color = colorData.colors[colorData.colors.length - 1];
                    }
                }

                (geoLayer as GeoJSON).setStyle({
                                                   className:   "app-map-region-geography",
                                                   fillColor:   color,
                                                   weight:      1,
                                                   opacity:     1.0,
                                                   color:       "#FFFFFF",
                                                   dashArray:   "",
                                                   fillOpacity: 1.0,
                                               });
            }
        }
        this._map.invalidateSize();
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
            const statsMap = await this.data.getRegionStatsMap(this.activeLayerGroup, this.activeRegionType, this.minDate, this.maxDate);
            log.debug("After stats");
            for (const feature of features) {
                const featureProperties = feature.properties;
                const region = featureProperties.name;
                const regionStats = statsMap[region];
                if (regionStats) {
                    featureProperties.count = regionStats.count;
                    featureProperties.exceedance = regionStats.exceedance;
                } else {
                    log.verbose("No data for " + region);
                    featureProperties.count = 0;
                    featureProperties.exceedance = 0;
                }
                if (feature === features[features.length - 1]) {
                    resolve();
                }

            }
        });

    }

}
