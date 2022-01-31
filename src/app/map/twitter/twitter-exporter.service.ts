import {Injectable} from "@angular/core";
import {boundingBoxForGeoJSON, readableTimestamp, toTitleCase} from "../../common";
import {ExportToCsv} from "export-to-csv";
import {CSVExportTweet, Tweet} from "./tweet";
import {AnnotationService} from "../../pref/annotation.service";
import {PreferenceService} from "../../pref/preference.service";
import {Region} from "../region-selection";
import {Logger} from "@aws-amplify/core";
import {PolygonData} from "../types";
import {RESTMapDataService} from "../data/rest-map-data.service";
import * as geojson from "geojson";
import {NotificationService} from "../../services/notification.service";

const log = new Logger("twitter-exporter");

@Injectable({
                providedIn: "root"
            })
export class TwitterExporterService {

    constructor(private _annotation: AnnotationService, private _pref: PreferenceService, private _mapdata: RESTMapDataService,
                private _notify: NotificationService) {
    }


    public async download(layerGroupId: string, polygonDatum: PolygonData, regionType: string, startDate: number,
                          endDate: number, annotationTypes: any[], layer: string): Promise<void> {
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
            filename:         `global-${layer}-tweet-export-${readableTimestamp()}`
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };

        const regions = await this._mapdata.places(regionType);
        const exportedTweets: CSVExportTweet[] = [];
        const tweetData: Promise<CSVExportTweet>[] = await this.loadDownloadData(layerGroupId, regionType, Array.from(regions), startDate,
                                                                                 endDate, regionType, annotationTypes);
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

    public async downloadAggregate(layerGroupId: string, aggregrationSetId: string, selectedAggregates: string[],
                                   polygonDatum: PolygonData, startDate: number, endDate: number, byRegion: string,
                                   annotationTypes: any[], layer: string) {
        log.debug(
            "downloadAggregate(aggregrationSetId=" + aggregrationSetId +
            ", selectedAggregates=" + selectedAggregates +
            ", polygonDatum=" + polygonDatum +
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
            filename:         `${aggregrationSetId}-${layer}-tweet-export-${selectedAggregates.join("-")}-${readableTimestamp()}`
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };
        if (selectedAggregates.length === this._mapdata.aggregations[aggregrationSetId].aggregates.length) {
            options.filename = `${aggregrationSetId}-${layer}-tweet-export-all-${readableTimestamp()}`;
        }
        const allRegions = await this._mapdata.regionsOfType(this._pref.combined.countryDownloadRegionType);
        const regions = allRegions.filter(i => selectedAggregates.includes(i.value)).map(i => i.value);

        const exportedTweets: CSVExportTweet[] = [];
        const tweetData: Promise<CSVExportTweet>[] = await this.loadDownloadData(layerGroupId,
                                                                                 this._pref.combined.countryDownloadRegionType, regions,
                                                                                 startDate, endDate, byRegion, annotationTypes);
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

    public async loadDownloadData(layerGroupId: string, regionType: string, regions: string[], startDate: number,
                                  endDate: number, byRegion: string, annotationTypes: any[]): Promise<Promise<CSVExportTweet>[]> {
        return (await this._mapdata.csvTweets(layerGroupId, regionType, regions, startDate, endDate, byRegion)).filter(
            i => i.valid && !this._pref.isBlacklisted(i)).map(
            async (i: Tweet) => {

                let region = "";
                if (i.region.match(/\d+/)) {
                    const polygon: geojson.Polygon = this._mapdata.regionGeography[i.region] as geojson.Polygon;
                    log.debug(this._mapdata.regionGeography);
                    log.debug(i.region);
                    log.debug(polygon.coordinates);
                    let boxForGeoJSON: any = boundingBoxForGeoJSON(polygon);
                    log.verbose(
                        `Bounding box of ${JSON.stringify(polygon)} is ${boxForGeoJSON}`);
                    region = `(${boxForGeoJSON[0]},${boxForGeoJSON[1]}),(${boxForGeoJSON[2]},${boxForGeoJSON[3]})`;
                } else {
                    region = toTitleCase(i.region);
                }
                log.verbose("Exporting region: " + i.region);
                const annotationRecord = await this._annotation.getAnnotations(i);
                let annotations: any = {};
                if (annotationRecord && annotationRecord.annotations) {
                    annotations = annotationRecord.annotations;
                }
                let impact = "";
                if (annotations.impact && annotationTypes.filter(i => i.name === "impact").length > 0) {
                    impact = annotations.impact;
                }
                let source = "";
                let includeSource: boolean = annotationTypes.filter(i => i.name === "source").length > 0;
                if (annotations.source && includeSource) {
                    source = annotations.source;
                }
                if (this._pref.combined.sanitizeForGDPR) {
                    return this.createCSVExportTweet(includeSource, region, impact, source, i.id, i.date.toUTCString(),
                                                     "https://twitter.com/username_removed/status/" + i.id,
                                                     this.sanitizeForGDPR($("<div>").html(i.html).text()), JSON.stringify(i.location));

                } else {
                    return this.createCSVExportTweet(includeSource, region, impact, source, i.id, i.date.toUTCString(),
                                                     "https://twitter.com/username_removed/status/" + i.id, $("<div>").html(i.html).text(),
                                                     JSON.stringify(i.location));
                }
            });

    }


    sanitizeForGDPR(tweetText: string): string {
        // — Tim Hopkins (@thop1988)
        return tweetText
            .replace(/@[a-zA-Z0-9_-]+/g, "@USERNAME_REMOVED")
            .replace(/— .+ \(@USERNAME_REMOVED\).*$/g, "");
    }

    public async exportToCSV(tweets: Tweet[], regions: Region[], annotationTypes: any[], layer: string) {
        this._notify.show("Preparing CSV download");
        let filename;
        if (regions.length === 1) {
            filename = `${regions[0].name}-${layer}-tweet-export-${readableTimestamp()}`;
        } else {
            filename = `multiple-regions-${layer}-tweet-export-${readableTimestamp()}`;
        }

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
            filename
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };

        const csvExporter = new ExportToCsv(options);
        const exportedPromises = tweets.filter(i => i.valid)
                                       .map(
                                           async i => {
                                               const annotationRecord = await this._annotation.getAnnotations(i);
                                               let annotations = {};
                                               if (annotationRecord && annotationRecord.annotations) {
                                                   annotations = annotationRecord.annotations;
                                               }
                                               let includeSource: boolean = annotationTypes.filter(i => i.name === "source").length > 0;
                                               return this.asCSV(i, this.regionMap(regions), this._pref.combined.sanitizeForGDPR,
                                                                 annotations, includeSource);
                                           });
        this._notify.show("All tweets annotated");
        const result: CSVExportTweet[] = [];
        for (const exportedPromise of exportedPromises) {
            result.push(await exportedPromise);
        }
        this._notify.show("Generating CSV");
        csvExporter.generateCsv(result);
        this._notify.dismiss();
    }


    public asCSV(tweet: Tweet, regionMap: any, sanitize: boolean, annotations: any = {}, includeSource: boolean): CSVExportTweet {
        let impact = "";
        if (annotations.impact) {
            impact = annotations.impact;
        }
        let source = "";
        if (annotations.source) {
            source = annotations.source;
        }
        tweet.lazyInit();
        if (sanitize) {
            return this.createCSVExportTweet(includeSource, regionMap[tweet.region], impact, source, tweet.id, tweet.date.toUTCString(),
                                             "https://twitter.com/username_removed/status/" + tweet.id,
                                             this.sanitizeForGDPR($("<div>").html(tweet.html).text()), JSON.stringify(tweet.location));

        } else {
            return this.createCSVExportTweet(includeSource, regionMap[tweet.region], impact, source, tweet.id, tweet.date.toUTCString(),
                                             tweet.url, $("<div>").html(tweet.html).text(), JSON.stringify(tweet.location));
        }
    }

    createCSVExportTweet(includeSource: boolean, region: string, impact: string = "", source: string = "", id: string, date: string,
                         url: string,
                         text: string, location: string) {
        // if (this._pref.combined.tweetCSVExportFormat === "pws") {
        if (includeSource) {
            return {region, impact, source, id, date, url, text, location};

        } else {
            return {region, impact, id, date, url, text, location};
        }

    }

    public regionMap(regions: Region[]) {
        const regionMap = {};
        for (const r of regions) {
            let regionName = `${r.title}`;

            if (r.isNumericRegion()) {
                let boxForGeoJSON: any = boundingBoxForGeoJSON(r.geometry);
                log.debug(
                    `Bounding box of ${JSON.stringify(
                        r.geometry.coordinates[0])} is (${boxForGeoJSON})`);
                regionName = `(${boxForGeoJSON[0]},${boxForGeoJSON[1]}),(${boxForGeoJSON[2]},${boxForGeoJSON[3]})`;
                regionMap[r.name] = regionName;
            } else {
                regionMap[r.name] = toTitleCase(regionName);
            }

        }
        return regionMap;
    }

}
