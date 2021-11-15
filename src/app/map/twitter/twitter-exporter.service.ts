import {Injectable} from "@angular/core";
import {readableTimestamp, toTitleCase} from "../../common";
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

        const regions = await this._mapdata.places(regionType);
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

    public async downloadAggregate(layerGroupId: string, aggregrationSetId: string, selectedAggregates: string[],
                                   polygonDatum: PolygonData, startDate: number, endDate: number) {
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
            filename:         `${aggregrationSetId}-tweet-export-${selectedAggregates.join("-")}-${readableTimestamp()}`
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
        };
        if (selectedAggregates.length === this._mapdata.aggregations[aggregrationSetId].aggregates.length) {
            options.filename = `${aggregrationSetId}-tweet-export-all-${readableTimestamp()}`;
        }
        const allRegions = await this._mapdata.allRegions();
        const regions = allRegions.filter(i => i.type === "bi_country").filter(i => selectedAggregates.includes(i.value)).map(i => i.value);

        const exportedTweets: CSVExportTweet[] = [];
        const tweetData: Promise<CSVExportTweet>[] = await this.loadDownloadData(layerGroupId, "bi_country", regions, startDate, endDate);
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
                                  endDate: number): Promise<Promise<CSVExportTweet>[]> {
        return (await this._mapdata.tweets(layerGroupId, regionType, regions, startDate, endDate)).filter(
            i => i.valid && !this._pref.isBlacklisted(i)).map(
            async (i: Tweet) => {

                let region = "";
                if (i.region.match(/\d+/)) {
                    let minX = null;
                    let maxX = null;
                    let minY = null;
                    let maxY = null;
                    const polygon: geojson.Polygon = this._mapdata.regionGeography[region] as geojson.Polygon;
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
                    annotations = annotationRecord.annotations;
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
                    return this.createCSVExportTweet(region, impact, source, i.id, i.date.toUTCString(),
                                                     "https://twitter.com/username_removed/status/" + i.id,
                                                     this.sanitizeForGDPR($("<div>").html(i.html).text()), JSON.stringify(i.location));

                } else {
                    return this.createCSVExportTweet(region, impact, source, i.id, i.date.toUTCString(),
                                                     "https://twitter.com/username_removed/status/" + i.id,
                                                     $("<div>").html(i.html).text(), JSON.stringify(i.location));
                }
            });

    }


    sanitizeForGDPR(tweetText: string): string {
        // — Tim Hopkins (@thop1988)
        return tweetText
            .replace(/@[a-zA-Z0-9_-]+/g, "@USERNAME_REMOVED")
            .replace(/— .+ \(@USERNAME_REMOVED\).*$/g, "");
    }

    public async exportToCSV(tweets: Tweet[], regions: Region[]) {
        this._notify.show("Preparing CSV download");
        let filename;
        if (regions.length === 1) {
            filename = `${regions[0].name}-tweet-export-${readableTimestamp()}`;
        } else {
            filename = `multiple-regions-tweet-export-${readableTimestamp()}`;
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
                                               return this.asCSV(i, this.regionMap(regions),
                                                                 this._pref.combined.sanitizeForGDPR, annotations);
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


    public asCSV(tweet: Tweet, regionMap: any, sanitize: boolean, annotations: any = {}): CSVExportTweet {
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
            return this.createCSVExportTweet(regionMap[tweet.region], impact, source, tweet.id, tweet.date.toUTCString(),
                                             "https://twitter.com/username_removed/status/" + tweet.id,
                                             this.sanitizeForGDPR($("<div>").html(tweet.html).text()), JSON.stringify(tweet.location));

        } else {
            return this.createCSVExportTweet(regionMap[tweet.region], impact, source, tweet.id, tweet.date.toUTCString(), tweet.url,
                                             $("<div>").html(tweet.html).text(), JSON.stringify(tweet.location));
        }
    }

    createCSVExportTweet(region: string, impact: string = "", source: string = "", id: string, date: string, url: string, text: string,
                         location: string) {
        if (this._pref.combined.tweetCSVExportFormat === "pws") {
            return {region, impact, source, id, date, url, text, location};
        } else {
            return {region, impact, source, id, date, url, text, location};

        }

    }

    public regionMap(regions: Region[]) {
        const regionMap = {};
        for (const r of regions) {
            let regionName = `${r.title}`;

            if (r.isNumericRegion()) {
                let minX = null;
                let maxX = null;
                let minY = null;
                let maxY = null;
                for (const point of r.geometry.coordinates[0]) {
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
                log.debug(
                    `Bounding box of ${JSON.stringify(
                        r.geometry.coordinates[0])} is (${minX},${minY}) to (${maxX},${maxY})`);
                regionName = `(${minX},${minY}),(${maxX},${maxY})`;
                regionMap[r.name] = regionName;
            } else {
                regionMap[r.name] = toTitleCase(regionName);
            }

        }
        return regionMap;
    }

}
