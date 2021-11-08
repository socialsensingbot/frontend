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
        this.serviceMetadata = await this._api.callMapAPIWithCache("metadata", {}, 60 * 60) as ServiceMetadata;
        await this.switchDataSet(mapId);
        this.aggregations = await this._api.callMapAPIWithCache(this.map.id + "/aggregations", {}, 24 * 60 * 60) as AggregationMap;
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
    public async loadGeography(regionType: string): Promise<geojson.FeatureCollection> {
        log.debug("Loading Geography");
        this._notify.show("Loading Geographic data ...", "OK", 20000);
        const regions = (await this.allRegions()).filter(i => i.type === regionType).map(i => i.value);
        const features = [];
        const promises = [];
        this.regionGeography = {};
        for (const region of regions) {
            log.verbose("Loading geography for : " + region);
            try {
                const promise: Promise<void> = this._api.callMapAPIWithCache(
                    this.map.id + "/region-type/" + regionType + "/region/" + region + "/geography", {}, 24 * 60 * 60)
                                                   .then((regionGeography) => {
                                                       this.regionGeography[region] = regionGeography;
                                                       features.push(
                                                           {
                                                               id:   "" + region,
                                                               type: "Feature",
                                                               // tslint:disable-next-line:no-string-literal
                                                               properties: {...regionGeography["properties"], name: region, count: 0},
                                                               geometry:   regionGeography
                                                           });
                                                   });
                promises.push(promise);
            } catch (e) {
                console.error(e);
            }

        }
        // Fork join.
        for (const promise of promises) {
            try {
                await promise;
            } catch (e) {
                console.error(e);
            }
        }
        this._regionGeographyGeoJSON = {type: "FeatureCollection", features};
        this._notify.dismiss();

        return this._regionGeographyGeoJSON;
    }

    public async load(first: boolean) {
    }

    public async tweets(layerGroupId: string, regionType: string, regions: string[], startDate,
                        endDate): Promise<Tweet[]> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        log.debug("requesting tweets for regions " + regions);
        const rawResult = await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/text-for-regions", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            regions,
            startDate: roundToHour(startDate),
            endDate:   roundToMinute(endDate)

        }, 0);
        log.debug(rawResult.length + " tweets back from server");
        const result: Tweet[] = [];
        for (const tweet of rawResult) {
            result.push(new Tweet(tweet.id, tweet.html, tweet.json, tweet.location, new Date(tweet.timestamp), tweet.region,
                                  tweet.possibly_sensitive));
        }
        return result;
    }

    public async now(): Promise<number> {
        return await this._api.callMapAPIWithCache(this.map.id + "/now", {}, 60) as Promise<number>;
    }

    public async recentTweets(layerGroupId: string, regionType: string): Promise<RegionTweeCount> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        return await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/recent-text-count", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            startDate: roundToFiveMinutes(await this.now() - this._pref.combined.recentTweetHighlightOffsetInSeconds * 1000),
            endDate:   roundToFiveMinutes(await this.now())

        }, 60) as Promise<RegionTweeCount>;
    }


    public async places(regionType: string): Promise<Set<string>> {
        return new Set<string>(
            await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/regions", {}, 24 * 60 * 60) as string[]);
    }


    public async switchDataSet(dataset: string): Promise<MapMetadata> {
        if (!this.initialized) {
            this._notify.error("Map Data Service not Initialized");
        }
        this.map.id = dataset;
        this.mapMetadata = (await this._api.callMapAPIWithCache(this.map.id + "/metadata", {}, 3600)) as MapMetadata;
        return this.mapMetadata;

    }


    public regionTypes() {
        return this.mapMetadata.regionTypes.map(i => i.id);
    }

    public hasCountryAggregates() {
        return this.mapMetadata.regionAggregations.length > 0;
    }


    public async minDate(): Promise<number> {
        return roundToHour(await this.now() - 4 * ONE_DAY);
    }

    public async regionStats(layerGroupId: string, regionType: string, region: string, startDate: number,
                             endDate: number): Promise<RegionStats> {
        const statsMap = await this.getRegionStatsMap(layerGroupId, regionType, startDate, endDate);
        if (statsMap.hasOwnProperty((region))) {
            return statsMap[region];
        } else {
            return null;
        }


    }

    public async preCacheRegionStatsMap(layerGroupId: string, activeRegionType: string, _dateMin: number, _dateMax: number): Promise<void> {
        await this.getRegionStatsMap(layerGroupId, activeRegionType, _dateMin, _dateMax);
    }

    public async geoJsonGeographyFor(regionType: string): Promise<FeatureCollection> {
        return await this.loadGeography(regionType) as FeatureCollection;
    }


    private layerGroup(id: string): SSMapLayer {
        return this._pref.combined.layers.available.filter(i => i.id === id)[0];
    }

    /**
     * CAUTION only returns non-numeric regions/
     * @param map
     */
    public async regions(map = this.map.id) {
        return await this._api.callMapAPIWithCache(map + "/regions", {}, 12 * 60 * 60);
    }

    public async allRegions(map = this.map.id) {
        return await this._api.callMapAPIWithCache(map + "/all-regions", {}, 12 * 60 * 60);
    }

    private async getRegionStatsMap(layerGroupId: string, regionType: string, startDate: number, endDate: number): Promise<RegionStatsMap> {
        const layerGroup: SSMapLayer = this.layerGroup(layerGroupId);
        const statsMap = await this._api.callMapAPIWithCache(this.map.id + "/region-type/" + regionType + "/stats", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            startDate: roundToHour(startDate),
            endDate:   roundToFiveMinutes(endDate)

        }, 5 * 60) as RegionStatsMap;
        return statsMap;
    }
}
