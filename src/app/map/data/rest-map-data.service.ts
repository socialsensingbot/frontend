import {Injectable, NgZone} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";
import {Tweet} from "../twitter/tweet";
import {NotificationService} from "../../services/notification.service";
import {NgForage, NgForageCache} from "ngforage";
import {PreferenceService} from "../../pref/preference.service";
import {roundToFiveMinutes, roundToHour, roundToMinute} from "../../common";
import * as geojson from "geojson";
import {AnnotationService} from "../../pref/annotation.service";
import {LoadingProgressService} from "../../services/loading-progress.service";
import {
    AggregationMap,
    MapCoreMetadata,
    MapMetadata,
    ONE_DAY,
    RegionGeography,
    RegionStats,
    RegionStatsMap,
    RegionTweeCount,
    ServiceMetadata
} from "./map-data";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {FeatureCollection} from "@amcharts/amcharts4-geodata/.internal/Geodata";
import {SSMapLayer} from "../../types";
import {MapSelectionService} from "../../map-selection.service";


const log = new Logger("map-data");


@Injectable({
                providedIn: "root"
            })
export class RESTMapDataService {
    public regionGeography: RegionGeography = {};
    public aggregations: AggregationMap = {};
    public mapMetadata: MapMetadata;
    public serviceMetadata: ServiceMetadata;


    public availableDataSets: MapCoreMetadata[];
    /**
     * This is the processed data from the server.
     *
     * @see _rawTwitterData for the unprocessed data.
     */
    private initialized: boolean;
    private _regionGeographyGeoJSON: geojson.FeatureCollection;
    public ready = false;
    public lastUpdated: Date;


    constructor(private _http: HttpClient, private _zone: NgZone, private _exec: UIExecutionService,
                private _notify: NotificationService, private readonly cache: NgForageCache,
                private readonly ngf: NgForage,
                private map: MapSelectionService,
                private _pref: PreferenceService,
                private _annotation: AnnotationService,
                private _loading: LoadingProgressService,
                protected _api: RESTDataAPIService,
    ) {

    }

    public async init(mapId: string): Promise<ServiceMetadata> {
        this.initialized = true;
        this.serviceMetadata = await this._api.callMapAPIWithCache("metadata", {}, 60 * 60, true, true, () => false) as ServiceMetadata;
        await this.switchDataSet(mapId);
        this.aggregations = await this._api.callMapAPIWithCache(this.map.id + "/aggregations", {}, 24 * 60 * 60, true, true,
                                                                () => false) as AggregationMap;
        log.debug("Aggregations", this.aggregations);
        await this._pref.waitUntilReady();
        const available = this._pref.combined.availableDataSets;
        if (available && available.length > 0 && available[0] !== "*") {
            this.availableDataSets = this.serviceMetadata.maps.filter(
                ds => available.includes(ds.id));
        } else {
            this.availableDataSets = this.serviceMetadata.maps;
        }

        this._notify.dismiss();
        this.ready = true;
        return this.serviceMetadata;
    }

    /**
     * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
     */
    public async loadGeography(regionType: string, interrupted: () => boolean): Promise<geojson.FeatureCollection> {
        log.debug("Loading Geography");
        let done = false;
        setTimeout(() => {
            if (!done) {
                this._notify.show("Loading Geographic data ...", "OK", 20000);
            }
        }, 400);

        this.regionGeography = await this._api.callMapAPIWithCache(
            this.map.id + "/region-type/" + regionType + "/geography", {}, 24 * 60 * 60, false, true, interrupted) as RegionGeography;
        done = true;
        this._notify.dismiss();
        const features = [];
        console.log("geography ", this.regionGeography)
        for (const region in this.regionGeography) {
            if (this.regionGeography.hasOwnProperty(region)) {
                features.push(
                    {id: "" + region,
                        type: "Feature",
                        properties: {...this.regionGeography[region]["properties"], name: region, count: 0},
                        geometry: this.regionGeography[region]
                    });
            }
        }
        console.log("geography -> features", features)
        this._regionGeographyGeoJSON = {type: "FeatureCollection", features};

        return this._regionGeographyGeoJSON;
    }


    // /**
    //  * Fetches the (nearly) static JSON files (see the src/assets/data directory in this project)
    //  */
    // public async loadGeography(regionType: string, interrupted: () => boolean): Promise<geojson.FeatureCollection> {
    //     log.debug("Loading Geography for " + regionType);
    //     const key: string = "geography-cache-v2:" + regionType;
    //     const cachedItem = await this.cache.getCached(key);
    //     if (cachedItem && cachedItem.hasData && !cachedItem.expired) {
    //         // tslint:disable-next-line:no-console
    //         log.debug("Loading Geography FROM CACHE for " + regionType);
    //         log.verbose("Value for " + key + "in cache");
    //         // log.debug("Value for " + key + " was " + JSON.stringify(cachedItem.data));
    //         // console.debug("Return cached item", JSON.stringify(cachedItem));
    //         this._regionGeographyGeoJSON = (cachedItem.data as any).geojson as geojson.FeatureCollection;
    //         this.regionGeography = (cachedItem.data as any).regionGeography as RegionGeography;
    //     } else {
    //         log.debug("Loading Geography NOT FROM CACHE for " + regionType);
    //         const allRegions: any = await this.allRegions();
    //         log.debug(allRegions);
    //         const regions = allRegions.filter(i => i.type === regionType).map(i => i.value);
    //         const lotsOfRegions: boolean = regions.length > 50;
    //         if (lotsOfRegions) {
    //             this._notify.show("Loading Geographic data ...", "OK", 20000);
    //         }
    //         const features = [];
    //         const promises = [];
    //         this.regionGeography = {};
    //         // tslint:disable-next-line:quotemark
    //         // let featureString = '{"type": "FeatureCollection","features":[';
    //         for (const region of regions) {
    //
    //             log.warn("REGION: " + region);
    //             promises.push(this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/region/" + region +
    // "/geography", {}, 365 * 24 * 60 * 60, false, true, interrupted) .then((regionGeography) => { this.regionGeography[region] =
    // regionGeography; // featureString += JSON.stringify(jsonObject) + ","; features.push({ id:   "" + region, type: "Feature", //
    // tslint:disable-next-line:no-string-literal properties: {...regionGeography["properties"], name: region, count: 0}, geometry:
    // regionGeography }); }));  } this._loading.showSpinner = true; let count = 0; let timeMessage = "this shouldn't take more than a few
    // seconds"; if (regions.length > 200) { timeMessage = "this may take a minute or two"; } if (regions.length > 1000) { timeMessage =
    // "this can take a few minutes, please bear with us"; } for (const promise of promises) { this._loading.progressPercentage = count *
    // 100 / features.length; if (count % 100 === 0 && lotsOfRegions) { this._notify.show(`Loading geographic data ${timeMessage},
    // ${promises.length - count} regions left.`, "OK", 20000); } await promise; count++; } // featureString = featureString.substring(0,
    // featureString.length - 1) + "]}"; if (lotsOfRegions) { this._notify.show(`Geographic data loaded, now caching for future use
    // ${timeMessage}.`, "OK", 60000); } this._regionGeographyGeoJSON = {type: "FeatureCollection", features}; await
    // this.cache.setCached(key, {geojson: this._regionGeographyGeoJSON, regionGeography: this.regionGeography}, 24 * 60 * 60 * 1000);
    // this._loading.showSpinner = false; if (lotsOfRegions) { this._notify.show(`All done now, thanks for your patience.`, "OK", 2000); }
    // } return this._regionGeographyGeoJSON;  }


    public async tweets(layerGroupId: string, regionType: string, regions: string[], startDate,
                        endDate, page = 0, pageSize = 100, restrictOrExclude: "restrict" | "exclude", ids: string[] = [],
                        names: string[] = []): Promise<Tweet[]> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);

        const promises: Promise<any[]>[] = [];
        const result: Tweet[] = [];
        //Get the bare bones of the tweet results
        const payload: any = {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            language:  layerGroup.language || "*",
            startDate: roundToHour(startDate),
            endDate:   roundToMinute(endDate),
            regions,
            pageSize,
            page,
            restrictOrExclude


        };
        if (restrictOrExclude === "restrict") {
            payload.restrictToIds = ids;
            payload.restrictToNames = names;
        } else {
            payload.excludeIds = ids;
            payload.excludeNames = names;

        }
        const skelTweets: any[] = await this._api.callMapAPIWithCache(
            this.map.id + "/region-type/" + regionType + "/text-for-regions", payload, 5 * 60, false, true, () => false);

        // Now fill them in asynchronously and combine with Promise.all()
        return (await Promise.all(
            skelTweets.map(tweetSkeleton => this._api.callMapAPIWithCache("text/" + tweetSkeleton.source + "/" + tweetSkeleton.id,
                                                                          {}, 60 * 60 * 24,
                                                                          true, false, () => false)
                                                .then(tweet => new Tweet(tweet.id, tweet.html, tweet.location, new Date(tweet.timestamp),
                                                                         tweetSkeleton.region, tweet.possibly_sensitive, tweet.text,
                                                                         tweet.verified, tweet.friends_count, tweet.followers_count,
                                                                         tweet.retweet_count,
                                                                         tweet.entities ? JSON.parse(tweet.entities) : null,
                                                                         tweet.profile_image_url, tweet.screen_name, tweet.username)))));

    }

    public async publicDisplayTweets(layerGroupId: string, regionType: string, startDate,
                                     endDate, pageSize = 100, maxPages = 10): Promise<Tweet[]> {

        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);

        return await this._api.callMapAPIWithCacheAndPaging(this.map.id + "/region-type/" + regionType + "/text-for-public-display", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            language:  layerGroup.language || "*",
            startDate: roundToHour(startDate),
            endDate:   roundToHour(endDate)

        }, (tweet) => new Tweet(tweet.id, null, null, new Date(tweet.timestamp), tweet.region, tweet.possibly_sensitive, tweet.text,
                                tweet.verified, tweet.friends_count, tweet.followers_count, tweet.retweet_count,
                                tweet.entities ? JSON.parse(tweet.entities) : null, tweet.profile_image_url, tweet.screen_name,
                                tweet.username), 60 * 60, pageSize, maxPages, () => false);

    }

    public async csvTweets(layerGroupId: string, regionType: string, regions: string[], startDate,
                           endDate, byRegion: string, pageSize = 100, maxPages = 1000,
                           interrupted: () => boolean = () => false): Promise<Tweet[]> {

        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);

        return await this._api.callMapAPIWithCacheAndPaging(this.map.id + "/region-type/" + regionType + "/csv-export", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            language:  layerGroup.language || "*",
            regions,
            byRegion,
            startDate: roundToHour(startDate),
            endDate:   roundToMinute(endDate),

        }, (tweet) => new Tweet(tweet.id, tweet.html, tweet.location, new Date(tweet.timestamp), tweet.region, tweet.possibly_sensitive,
                                tweet.text, tweet.verified, tweet.friends_count, tweet.followers_count, tweet.retweet_count,
                                tweet.entities ? JSON.parse(tweet.entities) : null, tweet.profile_image_url, tweet.screen_name,
                                tweet.username), 1 * 60, pageSize, maxPages, interrupted);
    }

    public async now(): Promise<number> {
        return await this._api.callMapAPIWithCache(this.map.id + "/now", {}, 60, false, true, () => false) as Promise<number>;
    }

    public async recentTweets(layerGroupId: string, regionType: string, interrupted: () => boolean): Promise<RegionTweeCount> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        return await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/recent-text-count", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            language:  layerGroup.language || "*",
            startDate: roundToFiveMinutes(await this.now() - this._pref.combined.recentTweetHighlightOffsetInSeconds * 1000),
            endDate:   roundToFiveMinutes(await this.now())

        }, 60, false, true, interrupted) as Promise<RegionTweeCount>;
    }


    public async places(regionType: string): Promise<Set<string>> {
        return new Set<string>(
            await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/regions", {}, 24 * 60 * 60, true, true,
                                                () => false) as string[]);
    }


    public async switchDataSet(dataset: string): Promise<MapMetadata> {
        if (!this.initialized) {
            this._notify.error("Map Data Service not Initialized");
        }
        this.map.id = dataset;
        this.mapMetadata = (await this._api.callMapAPIWithCache(this.map.id + "/metadata", {}, 3600, true, true,
                                                                () => false)) as MapMetadata;
        return this.mapMetadata;

    }


    public regionTypes() {
        return this.mapMetadata.regionTypes.map(i => i.id);
    }

    public hasCountryAggregates() {
        return this.mapMetadata.regionAggregations.length > 0;
    }


    public async minDate(): Promise<number> {
        return roundToHour(await this.now() - 7 * ONE_DAY);
    }

    public async regionStats(layerGroupId: string, regionType: string, region: string, startDate: number,
                             endDate: number, interrupted: () => boolean): Promise<RegionStats> {
        const statsMap = await this.getRegionStatsMap(layerGroupId, regionType, startDate, endDate, interrupted);
        if (statsMap.hasOwnProperty((region))) {
            return statsMap[region];
        } else {
            return null;
        }


    }

    public async preCacheRegionStatsMap(layerGroupId: string, activeRegionType: string, _dateMin: number, _dateMax: number,
                                        interrupted: () => boolean): Promise<void> {
        await this.getRegionStatsMap(layerGroupId, activeRegionType, _dateMin, _dateMax, interrupted);
    }

    public async geoJsonGeographyFor(regionType: string, interrupted: () => boolean): Promise<FeatureCollection> {
        return await this.loadGeography(regionType, interrupted) as FeatureCollection;
    }


    private layerGroup(id: string): SSMapLayer {
        return this._pref.enabledLayers.filter(i => i.id === id)[0];
    }

    /**
     * CAUTION only returns non-numeric regions/
     * @param map
     */
    public async regionsDropDown(map = this.map.id) {
        return await this._api.callMapAPIWithCache(map + "/regions", {}, 12 * 60 * 60, true, true, () => false);
    }

    public async allRegions(map = this.map.id) {
        return await this._api.callMapAPIWithCache(map + "/all-regions", {}, 12 * 60 * 60, true, true, () => false);
    }

    public async getRegionStatsMap(layerGroupId: string, regionType: string, startDate: number, endDate: number,
                                   interrupted: () => boolean): Promise<RegionStatsMap> {
        log.debug("getRegionStatsMap()", {layerGroupId, regionType, startDate, endDate})
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        if (startDate > endDate) {
            throw new Error(`Start date ${new Date(startDate)} cannot be greater than end date ${new Date(endDate)}`)
        }
        const statsMap = await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/stats", {
            hazards:             layerGroup.hazards,
            sources:             layerGroup.sources,
            warnings:            layerGroup.warnings,
            language:            layerGroup.language || "*",
            startDate:           roundToHour(startDate),
            endDate:             roundToFiveMinutes(endDate),
            exceedanceThreshold: this._pref.combined.exceedanceThreshold,
            countThreshold:      this._pref.combined.countThreshold

        }, 5 * 60, false, true, interrupted) as RegionStatsMap;
        this.lastUpdated = new Date(await this.now());
        return statsMap;
    }

    public async getAccurateRegionStatsMap(layerGroupId: string, regionType: string, startDate: number,
                                           endDate: number, retry: boolean, interrupted: () => boolean): Promise<RegionStatsMap> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        const statsMap = await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/accurate-stats", {
            hazards:             layerGroup.hazards,
            sources:             layerGroup.sources,
            warnings:            layerGroup.warnings,
            language:            layerGroup.language || "*",
            startDate:           roundToHour(startDate),
            endDate:             roundToFiveMinutes(endDate),
            exceedanceThreshold: this._pref.combined.exceedanceThreshold,
            countThreshold:      this._pref.combined.countThreshold

        }, 5 * 60, false, retry, interrupted) as RegionStatsMap;
        this.lastUpdated = new Date(await this.now());
        return statsMap;
    }

    public async regionsOfType(regionType: string): Promise<any[]> {
        const allRegions = await this.allRegions();
        return allRegions.filter(i => i.type === regionType);
    }
}
