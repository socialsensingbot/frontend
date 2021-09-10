import {Injectable, NgZone} from "@angular/core";
import {PolygonData} from "../types";
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
import {LayerGroup} from "../../types";


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

    public async tweets(layerGroupId: string, regionType: string, regions: string[], startDate,
                        endDate): Promise<Tweet[]> {
        const layerGroup: LayerGroup = this.layerGroup(layerGroupId);
        log.debug("requesting tweets for regions " + regions);
        const rawResult = await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/text-for-regions", {
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
            result.push(new Tweet(tweet.id, tweet.html, tweet.json, tweet.location, new Date(tweet.timestamp), tweet.region));
        }
        return result;
    }

    public async now(): Promise<number> {
        return await this._api.callMapAPIWithCache(this._mapId + "/now", {}, 60) as Promise<number>;
    }

    public async recentTweets(layerGroupId: string, regionType: string): Promise<RegionTweeCount> {
        const layerGroup: LayerGroup = this.layerGroup(layerGroupId);
        return await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/recent-text-count", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            startDate: roundToMinute(await this.now() - this._pref.combined.recentTweetHighlightOffsetInSeconds * 1000),
            endDate:   roundToMinute(await this.now())

        }) as Promise<RegionTweeCount>;
    }


    public async places(regionType: string): Promise<Set<string>> {
        return new Set<string>(
            await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/regions", {}, 24 * 60 * 60) as string[]);
    }


    public async download(layerGroupId: string, polygonDatum: PolygonData, regionType: string, startDate: number,
                          endDate: number): Promise<void> {
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

        const regions = await this.places(regionType);
        const exportedTweets: CSVExportTweet[] = [];
        const tweetData: Promise<CSVExportTweet>[] = await this.loadDownloadData(layerGroupId, regionType, Array.from(regions), startDate,
                                                                                 endDate);
        for (const i of tweetData) {
            exportedTweets.push(await i);
        }
        const csvExporter = new ExportToCsv(options);
        log.debug(exportedTweets);
        csvExporter.generateCsv(exportedTweets.sort((a, b) => {
            if (a.region < b.region) {
                return -1;
            }
            if (a.region > b.region) {
                return 1;
            }

            // names must be equal
            return 0;
        }));

    }

    public async downloadAggregate(layerGroupId: string, aggregrationSetId: string, selectedAggregates: string[], regionType: string,
                                   polygonDatum: PolygonData, startDate: number, endDate: number) {
        log.debug(
            "downloadAggregate(aggregrationSetId=" + aggregrationSetId +
            ", selectedAggregates=" + selectedAggregates +
            ", regionType=" + regionType + ", polygonDatum=" + polygonDatum +
            ", startDate=" + startDate + ", endDate=" + endDate + ")");
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
        const regions = this.aggregations[aggregrationSetId]
            .aggregates
            .filter(i => selectedAggregates.includes(i.id))
            .flatMap(x => x.regionTypeMap[regionType]).map(i => "" + i);

        const exportedTweets: CSVExportTweet[] = [];
        const tweetData: Promise<CSVExportTweet>[] = await this.loadDownloadData(layerGroupId, regionType, regions, startDate, endDate);
        for (const i of tweetData) {
            exportedTweets.push(await i);
        }
        const csvExporter = new ExportToCsv(options);
        log.debug(exportedTweets);
        csvExporter.generateCsv(exportedTweets.sort((a, b) => {
            if (a.region < b.region) {
                return -1;
            }
            if (a.region > b.region) {
                return 1;
            }

            // names must be equal
            return 0;
        }));


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

    private async regionNamesWithData(layerGroupId: string, regionType: string, startDate: number, endDate: number): Promise<string[]> {
        return Object.keys(await this.getRegionStatsMap(layerGroupId, regionType, startDate, endDate));
    }

    public async geoJsonGeographyFor(regionType: string): Promise<FeatureCollection> {
        return await this.loadGeography(regionType) as FeatureCollection;
    }

    sanitizeForGDPR(tweetText: string): string {
        // — Tim Hopkins (@thop1988)
        return tweetText
            .replace(/@[a-zA-Z0-9_-]+/g, "@USERNAME_REMOVED")
            .replace(/— .+ \(@USERNAME_REMOVED\).*$/g, "");
    }

    private async loadDownloadData(layerGroupId: string, regionType: string, regions: string[], startDate: number,
                                   endDate: number): Promise<Promise<CSVExportTweet>[]> {
        return (await this.tweets(layerGroupId, regionType, regions, startDate, endDate)).filter(
            i => i.valid && !this._pref.isBlacklisted(i)).map(
            async (i: Tweet) => {

                let region = "";
                if (i.region.match(/\d+/)) {
                    let minX = null;
                    let maxX = null;
                    let minY = null;
                    let maxY = null;
                    const polygon: geojson.Polygon = this.regionGeography[region] as geojson.Polygon;
                    for (const point of polygon.coordinates) {
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
                        `Bounding box of ${JSON.stringify(polygon)} is (${minX},${minY}) to (${maxX},${maxY})`);
                    region = `(${minX},${minY}),(${maxX},${maxY})`;
                } else {
                    region = toTitleCase(i.region);
                }
                log.verbose("Exporting region: " + i.region);
                const annotationRecord = await this._annotation.getAnnotations(i);
                let annotations: any = {};
                if (annotationRecord && annotationRecord.annotations) {
                    annotations = JSON.parse(annotationRecord.annotations);
                }
                let impact = "";
                if (annotations.impact) {
                    impact = annotations.impact;
                }
                let source = "";
                if (annotations.source) {
                    source = annotations.source;
                }
                if (this._pref.combined.sanitizeForGDPR) {
                    return new CSVExportTweet(region, impact, source, i.id, i.date.toUTCString(),
                                              "https://twitter.com/username_removed/status/" + i.id,
                                              this.sanitizeForGDPR($("<div>").html(i.html).text()), JSON.stringify(i.location));

                } else {
                    return new CSVExportTweet(region, impact, source, i.id, i.date.toUTCString(),
                                              "https://twitter.com/username_removed/status/" + i.id,
                                              $("<div>").html(i.html).text(), JSON.stringify(i.location));
                }
            });

    }

    private layerGroup(id: string): LayerGroup {
        return this._pref.combined.layerGroups.groups.filter(i => i.id === id)[0];
    }

    private async getRegionStatsMap(layerGroupId: string, regionType: string, startDate: number, endDate: number): Promise<RegionStatsMap> {
        const layerGroup: LayerGroup = this.layerGroup(layerGroupId);
        const statsMap = await this._api.callMapAPIWithCache(this._mapId + "/region-type/" + regionType + "/stats", {
            hazards:   layerGroup.hazards,
            sources:   layerGroup.sources,
            warnings:  layerGroup.warnings,
            startDate: roundToHour(startDate),
            endDate:   roundToHour(endDate)

        }, 600) as RegionStatsMap;
        return statsMap;
    }
}
