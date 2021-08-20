import {Injectable, NgZone} from "@angular/core";
import {Geometry, PolygonData} from "../types";
import {Logger} from "@aws-amplify/core";
import {HttpClient} from "@angular/common/http";
import {UIExecutionService} from "../../services/uiexecution.service";
import {CSVExportTweet, Tweet} from "../twitter/tweet";
import {NotificationService} from "../../services/notification.service";
import {NgForage, NgForageCache} from "ngforage";
import {ExportToCsv} from "export-to-csv";
import {PreferenceService} from "../../pref/preference.service";
import {readableTimestamp, roundToHour, roundToMinute, toTitleCase} from "../../common";
import * as geojson from "geojson";
import {AnnotationService} from "../../pref/annotation.service";
import {LoadingProgressService} from "../../services/loading-progress.service";
import {
    AggregationData,
    AggregationMap,
    MapCoreMetadata,
    MapMetadata,
    ONE_DAY,
    RegionGeography, RegionStats, RegionStatsMap,
    RegionTweeCount,
    ServiceMetadata
} from "./map-data";
import {RESTDataAPIService} from "../../api/rest-api.service";
import {FeatureCollection} from "@amcharts/amcharts4-geodata/.internal/Geodata";


const log = new Logger("map-data");


@Injectable({
                providedIn: "root"
            })
export class RESTMapDataService {
    public regionGeography: RegionGeography = {};
    public aggregations: AggregationMap = {};
    public mapMetadata: MapMetadata;
    public serviceMetadata: ServiceMetadata;

    private _mapId: string;
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
        this.aggregations = await this._api.callMapAPIWithCache(this._mapId + "/aggregations", {}, 24 * 60 * 60) as AggregationMap;
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
        this.regionGeography = await this._api.callMapAPIWithCache(
            this._mapId + "/region-type/" + regionType + "/geography", {}, 24 * 60 * 60) as RegionGeography;
        const features = [];
        for (const region in this.regionGeography) {
            if (this.regionGeography.hasOwnProperty(region)) {
                features.push(
                    {id: "" + region, type: "Feature", properties: {name: region, count: 0}, geometry: this.regionGeography[region]});
            }
        }

        this._regionGeographyGeoJSON = {type: "FeatureCollection", features};

        return this._regionGeographyGeoJSON;
    }

    public async load(first: boolean) {
    }

    public async tweets(regionType: string, regions: string[], startDate,
                        endDate): Promise<Tweet[]> {

        log.debug("requesting tweets for regions " + regions);
        const rawResult = await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/text-for-regions", {
            layerGroup: this.mapMetadata.defaultLayerGroup,
            regions,
            startDate:  roundToHour(startDate),
            endDate:    roundToMinute(endDate)

        }, 0);
        log.debug(rawResult.length + " tweets back from server");
        const result: Tweet[] = [];
        for (const tweet of rawResult) {
            result.push(new Tweet(tweet.id, tweet.html, tweet.json, tweet.location, new Date(tweet.timestamp), tweet.region));
        }
        return result;
    }

    public async now(): Promise<number> {
        return await this._api.callMapAPIWithCache(this._mapId + "/now", {}, 60) as Promise<number>;
    }

    public async recentTweets(regionType: string): Promise<RegionTweeCount> {

        return await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/recent-text-count", {
            layerGroup: this.mapMetadata.defaultLayerGroup,
            startDate:  await this.now() - this._pref.combined.recentTweetHighlightOffsetInSeconds * 1000,
            endDate:    await this.now()

        }) as Promise<RegionTweeCount>;
    }


    public async places(regionType: string): Promise<Set<string>> {
        return new Set<string>(
            await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/regions", {}, 24 * 60 * 60) as string[]);
    }


    public async download(polygonDatum: PolygonData, regionType: string, startDate: number, endDate: number): Promise<void> {
        const exportedTweets: CSVExportTweet[] = [];
        const options = {
            fieldSeparator:   ",",
            quoteStrings:     "\"",
            decimalSeparator: ".",
            showLabels:       true,
            showTitle:        false,
            title:            "",
            useTextFile:      false,
            useBom:           true,
            useKeysAsHeaders: true,
            filename:         `global-tweet-export-${readableTimestamp()}`
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };
        for (const region of await this.regionNamesWithData(regionType, startDate, endDate)) {
            await this.exportRegionForCSV(polygonDatum, regionType, region, exportedTweets, startDate, endDate);
        }
        const csvExporter = new ExportToCsv(options);
        csvExporter.generateCsv(exportedTweets);


    }

    public async downloadAggregate(aggregrationSetId: string, selectedAggregates: string[], regionType: string,
                                   polygonDatum: PolygonData, startDate: number, endDate: number) {
        log.debug(
            "downloadAggregate(aggregrationSetId=" + aggregrationSetId +
            ", selectedAggregates=" + selectedAggregates +
            ", regionType=" + regionType + ", polygonDatum=" + polygonDatum +
            ", startDate=" + startDate + ", endDate=" + endDate + ")");
        const exportedTweets: CSVExportTweet[] = [];
        const options = {
            fieldSeparator:   ",",
            quoteStrings:     "\"",
            decimalSeparator: ".",
            showLabels:       true,
            showTitle:        false,
            title:            "",
            useTextFile:      false,
            useBom:           true,
            useKeysAsHeaders: true,
            filename:         `${aggregrationSetId}-tweet-export-${selectedAggregates.join("-")}-${readableTimestamp()}`
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };
        if (selectedAggregates.length === this.aggregations[aggregrationSetId].aggregates.length) {
            options.filename = `${aggregrationSetId}-tweet-export-all-${readableTimestamp()}`;
        }
        const layerAggregationList = this.aggregations[aggregrationSetId]
            .aggregates
            .filter(i => selectedAggregates.includes(i.id))
            .flatMap(x => x.regionTypeMap[regionType]);
        for (const region of await this.regionNamesWithData(regionType, startDate, endDate)) {
            if (layerAggregationList.includes(region)) {
                await this.exportRegionForCSV(polygonDatum, regionType, region, exportedTweets, startDate, endDate);

            }
        }
        const csvExporter = new ExportToCsv(options);
        csvExporter.generateCsv(exportedTweets);


    }

    public async switchDataSet(dataset: string): Promise<MapMetadata> {
        if (!this.initialized) {
            this._notify.error("Map Data Service not Initialized");
        }
        this._mapId = dataset;
        this.mapMetadata = (await this._api.callMapAPIWithCache(this._mapId + "/metadata", {}, 3600)) as MapMetadata;
        return this.mapMetadata;

    }


    public regionTypes() {
        return this.mapMetadata.regionTypes.map(i => i.id);
    }

    public hasCountryAggregates() {
        return this.mapMetadata.regionAggregations.length > 0;
    }

    public async exportRegionForCSV(polygonDatum: PolygonData, regionType: string, region: string,
                                    exportedTweets: CSVExportTweet[], startDate, endDate): Promise<void> {
        let geometry;
        for (const feature of polygonDatum.features) {
            if (feature.id === region) {
                geometry = feature.geometry;
            }
        }
        if (typeof geometry === "undefined") {
            log.warn("No geometry for " + region);
        } else {

            const exportedPromises = await this.downloadRegion(regionType, region,
                                                               geometry, startDate, endDate);
            for (const exportedElement of exportedPromises) {
                exportedTweets.push(exportedElement);
            }
        }
    }


    private async downloadRegion(regionType: string, region: string,
                                 geometry: Geometry, startDate: number, endDate: number): Promise<CSVExportTweet[]> {
        const regionMap = {};
        if (region.match(/\d+/)) {
            let minX = null;
            let maxX = null;
            let minY = null;
            let maxY = null;
            for (const point of geometry.coordinates[0]) {
                if (minX === null || point[0] < minX) {
                    minX = point[0];
                }
                if (minY === null || point[1] < minY) {
                    minY = point[1];
                }
                if (maxX === null || point[0] > maxX) {
                    maxX = point[0];
                }
                if (maxY === null || point[1] > maxY) {
                    maxY = point[1];
                }
            }
            log.verbose(
                `Bounding box of ${JSON.stringify(geometry.coordinates[0])} is (${minX},${minY}) to (${maxX},${maxY})`);
            regionMap[region] = `(${minX},${minY}),(${maxX},${maxY})`;
        } else {
            regionMap[region] = toTitleCase(region);
        }
        log.verbose("Exporting region: " + region);
        const exportedPromises = (await this.tweets(regionType, [region], startDate, endDate))
            .filter(i => i.valid && !this._pref.isBlacklisted(i))
            .map(
                async i => {
                    const annotationRecord = await this._annotation.getAnnotations(i);
                    let annotations = {};
                    if (annotationRecord && annotationRecord.annotations) {
                        annotations = JSON.parse(annotationRecord.annotations);
                    }
                    return i.asCSV(regionMap, this._pref.combined.sanitizeForGDPR,
                                   annotations);
                });
        const result: CSVExportTweet[] = [];
        for (const exportedPromise of exportedPromises) {
            result.push(await exportedPromise);
        }
        return result;

    }

    public async minDate(): Promise<number> {
        return roundToHour(await this.now() - 4 * ONE_DAY);
    }

    public async regionStats(regionType: string, region: string, startDate: number, endDate: number): Promise<RegionStats> {
        const statsMap = await this.getRegionStatsMap(regionType, startDate, endDate);
        if (statsMap.hasOwnProperty(("" + region))) {
            return statsMap["" + region];
        } else {
            return null;
        }


    }

    private async getRegionStatsMap(regionType: string, startDate: number, endDate: number): Promise<RegionStatsMap> {
        const statsMap = await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/stats", {
            layerGroup: this.mapMetadata.defaultLayerGroup,
            startDate:  roundToHour(startDate),
            endDate:    roundToHour(endDate)

        }, 60) as RegionStatsMap;
        return statsMap;
    }

    private async regionNamesWithData(regionType: string, startDate: number, endDate: number): Promise<string[]> {
        return Object.keys(this.getRegionStatsMap(regionType, startDate, endDate));
    }

    public async geoJsonGeographyFor(regionType: string): Promise<FeatureCollection> {
        return await this.loadGeography(regionType) as FeatureCollection;
    }
}
