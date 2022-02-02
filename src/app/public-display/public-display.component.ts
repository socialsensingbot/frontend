import {Component, NgZone, OnInit} from "@angular/core";
import {GeoJSON, latLng, Layer, layerGroup, LayerGroup, Map, tileLayer} from "leaflet";
import * as rxjs from "rxjs";
import {Subscription} from "rxjs";
import {Tweet} from "../map/twitter/tweet";
import {DateRangeSliderOptions} from "../map/date-range-slider/date-range-slider.component";
import {ONE_DAY, RegionStatsMap, RegionTweeCount} from "../map/data/map-data";
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
import {SSMapLayer} from "../types";
import {blacklist} from "./keywords";

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
    private DEFAULT_LAYER_GROUP = "flood";
    private _blinkTimer: Subscription;
    private _inFeature: boolean;

    private _selectedFeatureNames: string[] = [];
    private regionTweetMap: RegionTweeCount;
    private _script: string;
    public title: string;
    private _lat: number;
    private _lon: number;
    private _zoom: number;
    private _statsMap: RegionStatsMap;
    private step: number;
    private window: number;
    private speed: number;
    private offset: number;
    public layer: SSMapLayer;

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

    private _activeStatistic: StatisticType = "exceedance";

    public get activeStatistic(): StatisticType {
        return this._activeStatistic;
    }

    public set activeStatistic(value: StatisticType) {
        log.debug("set activeStatistic");
        if (this._activeStatistic !== value) {
            this._activeStatistic = value;
        }
    }

    private _activeRegionType: string = "county";

    public get activeRegionType(): string {
        return this._activeRegionType;
    }

    public set activeLayerGroup(value: string) {
        log.debug("set activeLayerGroup");
        if (value !== this._activeLayerGroup) {
            this._activeLayerGroup = value;
        }

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
                private _display: DisplayScriptService,
                public map: MapSelectionService
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
        const {zoom, lng, lat} = {
            ...this.data.serviceMetadata.start,
            ...this.data.mapMetadata.start,
            ...this.route.snapshot.queryParams,
        };


        this._lat = +lat;
        this._lon = +lng;
        this._zoom = +zoom;
        this._map.setView([this._lat, this._lon]);
        this._map.setZoom(this._zoom);

        let queryParams = this.route.snapshot.queryParamMap;
        if (queryParams.has("active_number")) {
            this._activeStatistic = queryParams.get("active_number") as StatisticType;
        }
        if (queryParams.has("active_polygon")) {
            this._activeRegionType = queryParams.get("active_polygon") as string;
        }
        if (queryParams.has("active_layer")) {
            this._activeLayerGroup = queryParams.get("active_layer") as string;
        }
        if (queryParams.has("step")) {
            this.step = +queryParams.get("step") * 60 * 60 * 1000;
        }
        if (queryParams.has("window")) {
            this.window = +queryParams.get("window") * 60 * 60 * 1000;
        }

        if (queryParams.has("speed")) {
            this.speed = +queryParams.get("speed") * 1000;
        }
        if (queryParams.has("offset")) {
            this.offset = +queryParams.get("offset") * 24 * 60 * 60 * 1000;
        }

        this._loggedIn = await Auth.currentAuthenticatedUser() != null;
        // this.displayScript = this._display.script("county_ex_range_24h_step_1h_win_6h");
        this.displayScript = this._display.script(this._script);
        this._notify.show("Loading data please wait")
        this.loading.loaded();
        await this.nextScreen();
        this._notify.dismiss();
        let animationLoopCounter = 0;
        let animationStepCounter = 0;
        let completedAnimations = 0;
        await this.resetStatisticsLayer(this._activeStatistic);
        let animateFunc: () => Promise<void> = async () => {
            let now: number = roundToHour(await this.data.now());
            try {
                const animation = this.currentDisplayScreen.animation;
                let startTimeOffsetMilliseconds = this.offset ? this.offset : animation.startTimeOffsetMilliseconds;
                let windowDurationMillis: number = this.window ? this.window : animation.windowDurationInMilliseconds;
                let stepDurationMillis: number = this.step ? this.step : animation.stepDurationInMilliseconds;
                let speedInMillis: number = this.speed ? this.speed : this.currentDisplayScreen.stepDurationInMilliseconds;

                const stepsPerLoop = Math.round(speedInMillis / 100) - 1;
                if (animationLoopCounter % stepsPerLoop === 0) {
                    if (animation.type === "date-animation") {
                        this.minDate = roundToHour(now - startTimeOffsetMilliseconds + (
                            stepDurationMillis * animationStepCounter
                        ));
                        this.maxDate = roundToHour(this.minDate + windowDurationMillis);
                        log.debug(`${animationLoopCounter}: From ${new Date(this.minDate)} to ${new Date(this.maxDate)}`);
                        animationStepCounter++;
                        if (this.maxDate >= now - animation.endTimeOffsetMilliseconds) {
                            animationStepCounter = 0;
                            now = await this.data.now();
                            completedAnimations++;
                        }
                        this._statsMap = await this.data.getRegionStatsMap(this._activeLayerGroup, this._activeRegionType, this.minDate,

                                                                           this.maxDate);
                        if (this.pref.combined.publicDisplayTweetScroll === "window") {
                            this.tweets = await this.data.publicDisplayTweets(this.activeLayerGroup, this.activeRegionType,
                                                                              this.minDate,
                                                                              this.maxDate);
                            //Sort tweets by region exceedance
                            this.tweets.sort((i, j) => {
                                return this.windowedSortOrderForTweet(i) - this.windowedSortOrderForTweet(j);
                            });
                            this.tweets = this.tweets.filter(i => this.filterTweet(i))
                            this.tweets.slice(0, this.pref.combined.publicDisplayMaxTweets);
                        }

                        await this.updateRegionDisplay(this.activeStatistic);

                    }
                }
                animationLoopCounter++;
                this.sliderOptions = {
                    min:      now - startTimeOffsetMilliseconds,
                    max:      now,
                    startMin: this.minDate,
                    startMax: this.maxDate
                };
                this.ready = true;
                if (completedAnimations >= this.currentDisplayScreen.animationLoops) {
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

    private windowedSortOrderForTweet(i: Tweet): number {
        const tokens: string[] = i.tokens;
        const greyListPenalty = i.greylisted ? 100 : 1;
        return this._statsMap[i.region] ? ((this._statsMap[i.region].exceedance / (i.mediaCount + 0.5)) * (1.0 + Math.random() / 10)) * greyListPenalty * (i.potentiallySensitive ? 1000 : 1) : Infinity;
    }

    private allTweetSortOrderForTweet(i: Tweet): number {
        const mediaBonus: number = (i.mediaCount ** 2) + 0.1;
        const agepenalty: number = (i.date.getTime() - this.sliderOptions.min) / 60 * 60 * 1000 > 1 ? 8 : 1;
        const sensitivePenalty: number = i.potentiallySensitive ? 1024 : 1;
        const greyListPenalty = i.greylisted ? 1024 : 1;
        // Filter out more spammy users
        let ratio: number = i.json.user.followers_count / (i.json.user.friends_count || 1);
        // This penalises spammy users
        const followerRatioPenalty = ratio <= 1 ? 32 : 1;
        // This penalises broadcast (news like) accounts.
        const followerPenalty = i.json.user.followers_count > 256 ? 4 : 1;
        // This heavily penalises non-interactive accounts (following too many people)
        const friendsPenalty = i.json.user.friends_count > 1000 ? 128 : 1;
        const mentionsPenalty = (i.json.entities?.user_mentions?.length > 2) ? 2 : 1;
        const hashtagsPenalty = (i.json.entities?.hashtags?.length > 2) ? 16 : 1;
        const urlPenalty = (i.json.entities?.urls?.length > 0 && i.mediaCount === 0) ? 64 : 1;
        const verifiedPenalty = i.json.user.verified ? 4 : 1;
        const lengthPenalty = i.tokens.length < 20 ? 2 : 1;
        return this._statsMap && this._statsMap[i.region] ? (this._statsMap[i.region].exceedance / mediaBonus)
            * sensitivePenalty * greyListPenalty * followerRatioPenalty * mentionsPenalty
            * hashtagsPenalty * urlPenalty * lengthPenalty * agepenalty * verifiedPenalty * followerPenalty * friendsPenalty : Infinity;
    }

    private updateAnnotationTypes(): void {
        log.debug("Finding annotations for layer ", this._activeLayerGroup);
        log.debug("Finding annotations for layer ", this.layer);
        if (this.layer) {
            const activeAnnotationTypes: any = this.layer.annotations;
            log.debug("Available annotations are ", activeAnnotationTypes);
            this.annotationTypes = this.pref.combined.annotations.filter(
                i => typeof activeAnnotationTypes === "undefined" || activeAnnotationTypes.includes(i.name));
            log.debug("Annotations are ", this.annotationTypes);
        }
    }

    private async nextScreen() {
        try {

            this.ready = false;
            this.currentDisplayScreen = this.displayScript.screens[this.currentDisplayNumber % this.displayScript.screens.length];
            if (this.currentDisplayScreen.data?.layerId) {
                this.activeLayerGroup = this.currentDisplayScreen.data.layerId;
            }
            if (this.currentDisplayScreen.data?.statistic) {
                this.activeStatistic = this.currentDisplayScreen.data.statistic;
            }
            if (this.currentDisplayScreen.data?.regionType) {
                this.activeRegionType = this.currentDisplayScreen.data.regionType;
            }
            if (this.currentDisplayScreen.location?.lat) {
                this._lat = this.currentDisplayScreen.location.lat;
            }
            if (this.currentDisplayScreen.location?.lon) {
                this._lon = this.currentDisplayScreen.location.lon;
            }
            if (this.currentDisplayScreen.location?.zoom) {
                this._zoom = this.currentDisplayScreen.location.zoom;
            }
            await this.pref.waitUntilReady();
            this.layer = this.pref.combined.layers.available.filter(i => i.id === this._activeLayerGroup)[0];
            this._twitterIsStale = true;
            this.updateAnnotationTypes();
            await this.load();
            this.title = this.currentDisplayScreen.title;
            await this.data.loadGeography(this.activeRegionType);
            await this.resetStatisticsLayer(this.activeStatistic);
            if (this.pref.combined.publicDisplayTweetScroll === "all") {
                this.tweets = this.cleanTweetsAndLimit(await this.data.publicDisplayTweets(this.activeLayerGroup, this.activeRegionType,
                                                                                           this.sliderOptions.min,
                                                                                           this.sliderOptions.max, 100,
                                                                                           (this.pref.combined.publicDisplayMaxTweets / 100) * 3));

            }
            this.currentDisplayNumber++;
            return this.currentDisplayScreen;
        } catch (e) {
            console.error(e);
        }
    }

    private cleanTweetsAndLimit(tweets: Tweet[]): Tweet[] {
        // remove blacklisted
        tweets = tweets.filter(i => this.filterTweet(i));
        // remove duplicates
        const map = {};
        tweets.forEach(i => {
            return map[JSON.stringify(i.tokens)] = i;
        });
        tweets = Object.values(map);
        // sort tweets
        tweets.sort((i, j) => {
            return this.allTweetSortOrderForTweet(i) - this.allTweetSortOrderForTweet(j);
        });
        // if there are spare tweets, clean out the rubbish ones
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !i.greylisted);
        }
        // Filter out more spammy users
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => i.json.user.followers_count / (i.json.user.friends_count || 1) > 1);
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets && tweets.filter(
            i => i.mediaCount !== 0).length > this.pref.combined.publicDisplayMaxTweets / 2) {
            tweets = tweets.filter(i => i.mediaCount !== 0);
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !(i.mediaCount === 0 && i.json.entities?.urls?.length > 0));
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !i.potentiallySensitive);
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !(i.json.entities?.user_mentions?.length > 2));
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !(i.json.entities?.hashtags?.length > 2));
        }
        if (tweets.length > this.pref.combined.publicDisplayMaxTweets) {
            tweets = tweets.filter(i => !i.json.user.verified);
        }
        return tweets.slice(0, this.pref.combined.publicDisplayMaxTweets);
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
            this.geographyData = await this.data.geoJsonGeographyFor(this._activeRegionType) as PolygonData
            this.regionTweetMap = await this.data.recentTweets(this._activeLayerGroup, this._activeRegionType);
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
                const locationChangeAnimationDuration: number = this.currentDisplayScreen.location?.animationDuration || 1000;
                this._map.flyTo(latLng([this._lat, this._lon]),
                                this._zoom,
                                {animate: true, duration: locationChangeAnimationDuration / 1000, easeLinearity: 0.2});
                await sleep(locationChangeAnimationDuration);

            }
            this._map.addLayer(curLayerGroup);
            this.currentStatisticsLayer = curLayerGroup;
        } catch (e) {
            console.error(e);
        } finally {
            // this.loading.hideIndeterminateSpinner();
        }

    }

    private async updateRegionDisplay(layer: "count" | "exceedance"): Promise<void> {
        if (this.currentStatisticsLayer && this.currentStatisticsLayer.getLayers()[0]) {
            let layers: Layer[] = (this.currentStatisticsLayer.getLayers()[0] as GeoJSON).getLayers();
            for (const geoLayer of layers) {
                const feature: any = (geoLayer as GeoJSON).feature;
                const featureProperties = feature.properties;
                const region = featureProperties.name;
                const regionStats = (this._statsMap)[region];
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
                                                   weight:      0.5,
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

    private filterTweet(i: Tweet): any {
        const tokens: string[] = i.tokens;
        let blacklistedWords: string[] = blacklist.filter(i => tokens.includes(i));
        if (blacklistedWords.length > 0) {
            console.warn(i.html + " BLACKLISTED because of ", blacklistedWords);
        }
        return !this._statsMap || typeof this._statsMap[i.region] !== "undefined" || i.blacklisted;
    }
}
