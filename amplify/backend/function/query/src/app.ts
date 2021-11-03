/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";
import {AggregationMap, MapMetadata, RegionGeography, ServiceMetadata} from "./map-data";
import {Pool} from "mysql";

const md5 = require('md5');
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: true});
const dateFromMillis = (time: number) => {
    const dateTime = new Date(time);
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
};
const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.substring("query-".length);
console.log("STAGE: " + stage);
const dev = stage === "dev";
// Load modules

export const roundToHour = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundToMinute = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundTo15Minute = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 15) * 15);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};
// Only set to disable the entire API, i.e. to protect the dev database from excessively long queries.
const disabled = false;
module.exports = (connection: Pool) => {

    // declare a new express app
    const app = express();
    app.use(bodyParser.json());
    app.use(awsServerlessExpressMiddleware.eventContext());

    app.use((req, res, next) => {
        // Enable CORS for all methods
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "*");
        res.setHeader("X-SocialSensing", "true");
        next();
    });


    let metadata = null;
    let queryMap = null;

    const sql = async (options: {
        sql: string;
        values?: any;
    }, tx = false): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            connection.getConnection((err, poolConnection) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (tx) {
                    poolConnection.beginTransaction();
                }
                poolConnection.query(options, (error, results) => {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        let s: string = JSON.stringify(results);
                        console.log(options.sql, options.values, s.substring(0, s.length > 1000 ? 1000 : s.length));
                        console.log("Returned " + results.length + " rows");
                        resolve(results);
                        if (tx) {
                            poolConnection.commit();
                        }
                    }
                    poolConnection.release();
                });
            });

        });
    };

    // Analytics Queries

    app.get("/query/:name", async (req, res) => {
        return res.status(405).json({error: "GET is not supported for queries, use POST instead."});
    });

    const cache = (res, key: string, value: () => Promise<any>, options: { duration: number } = {duration: 60}) => {
        if (disabled) {
            res.setHeader("X-SocialSensing-API-Disabled");
            res.status(500);
            return;
        }
        res.setHeader("X-SocialSensing-CachedQuery-Key", key);
        if (key != null && queryCache.has(key)) {
            console.log("Returned from cache " + key);
            res.setHeader("X-SocialSensing-CachedQuery-Key", key);
            res.setHeader("X-SocialSensing-CachedQuery-Expires-At", queryCache.getTtl(key));
            res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Minutes", (queryCache.getTtl(key) - Date.now()) / (60 * 1000));
            res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Hours", (queryCache.getTtl(key) - Date.now()) / (60 * 60 * 1000));
            res.json(queryCache.get(key));
            return;
        } else {
            console.log("Retrieving query for " + key);

            res.setHeader("X-SocialSensing-CachedQuery", "false");
            value().then(result => {
                if (key !== null) {
                    queryCache.set(key, result, options.duration);
                }
                res.json(result);
            }).catch(e => handleError(res, e));
        }
    };


    // General Reference Data Queries
    app.get("/refdata/:name", (req, res) => {
        if (!metadata) {
            metadata = new QueryMetadataSets(connection);
        }
        metadata[req.params.name].then(results => res.json(results))
                                 .catch(error => {
                                     console.error(error);
                                     metadata = null;
                                     return res.json({error: error.message, details: JSON.stringify(error)});
                                 });
    });


    // Reference Data for UI and Analytics
    app.get("/refdata/:name", (req, res) => {
        if (!metadata) {
            metadata = new QueryMetadataSets(connection);
        }
        metadata[req.params.name].then(results => res.json(results))
                                 .catch(error => {
                                     metadata = null;
                                     console.error(error);
                                     return res.json({error: error.message, details: JSON.stringify(error)});
                                 });
    });


    // Map Related Queries
    app.post("/map/metadata", async (req, res) => {


        cache(res, req.path, async () => {
            const data = await sql({
                                       sql:    `select * from ref_map_metadata`,
                                       values: {}
                                   });
            return {
                version: "1.0",
                maps:    data,
                start:   {
                    lat:  53,
                    lng:  -2,
                    zoom: 6
                }

            } as ServiceMetadata;

        });


    });


    function handleError<ResBody>(res, e): void {
        res.status(500).json(
            {error: JSON.stringify(e), errorMessage: e.message, errorAsString: e.toString(), errorStack: dev ? e.stack : "n/a"});
    }

    async function getMap(mapId: string): Promise<any> {
        return (await sql({
                              // language=MySQL
                              sql: `select *
                                    from ref_map_metadata
                                    where id = ?`, values: [mapId]
                          }))[0];
    }

    const maps = sql({
                         // language=MySQL
                         sql: `select *
                               from ref_map_metadata`, values: []
                     }).then(rows => {
        const allMaps = {};
        rows.forEach(map => allMaps[map.id] = map);
        return allMaps;
    });


    app.post("/map/:map/metadata", async (req, res) => {
        cache(res, req.path, async () => {


            const map = await getMap(req.params.map);

            // const hazards = await sql({
            //                               // language=MySQL
            //                               sql: `select hazard
            //                                 from ref_map_metadata_hazards
            //                                 where map_id = ?`, values: [req.params.map]
            //                           });


            const regionTypes = await sql({
                                              // language=MySQL
                                              sql: `select region_id as id, title
                                                    from ref_map_metadata_region_types
                                                    where map_id = ?`, values: [req.params.map]
                                          });


            const regionAggregations = (await sql({
                                                      // language=MySQL
                                                      sql: `select region_aggregation_type_id as id
                                                            from ref_map_metadata_region_aggregations
                                                            where map_id = ?`, values: [req.params.map]
                                                  })).map(i => i.id);

            console.log("map=", map);
            return {

                id:       map.id,
                title:    map.title,
                version:  map.version,
                location: map.location,
                // hazards:           hazards.map(i => i.hazard),
                regionTypes,
                regionAggregations,
                defaultRegionType: map.default_region_type,
                start:             {
                    lat:  map.start_lat,
                    lng:  map.start_lng,
                    zoom: map.start_zoom
                }
            } as MapMetadata;

        });

    });

    const warningsValues = (warning: string) => {
        if (warning === "only") {
            return [1, 1];
        }
        if (warning === "include") {
            return [0, 1];
        }
        if (warning === "exclude") {
            return [0, 0];
        }
        throw new Error("Unrecognized warning option: " + warning);
    };

    app.post("/map/:map/region-type/:regionType/text-for-regions", async (req, res) => {
        const start = Math.floor(req.body.startDate / 1000);
        const lastDate: Date = (await maps)[req.params.map].last_date;
        const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
        const end = Math.floor(endDate / 1000);
        const periodLengthInSeconds: number = end - start;
        console.debug("Period Length in Seconds: " + periodLengthInSeconds);
        console.debug("StartDate: " + new Date(req.body.startDate));
        console.debug("EndDate: " + new Date(endDate));
        console.debug("Start: " + new Date(start * 1000));
        console.debug("End: " + new Date(end * 1000));

        cache(res, req.path + ":" + JSON.stringify(req.body), async () => {

            return (await sql({
                                  // language=MySQL
                                  sql: `/* app.ts: text_for_regions */ select t.source_json            as json,
                                                                              t.source_html            as html,
                                                                              r.source_timestamp       as timestamp,
                                                                              r.source_id              as id,
                                                                              ST_AsGeoJSON(t.location) as location,
                                                                              r.region                 as region,
                                                                              t.possibly_sensitive     as possibly_sensitive
                                                                       FROM live_text t,
                                                                            mat_view_regions r
                                                                       WHERE t.source = r.source
                                                                         and t.source_id = r.source_id
                                                                         and t.hazard = r.hazard
                                                                         and r.region_type = ?
                                                                         and r.region in (?)
                                                                         and r.hazard IN (?)
                                                                         and r.source IN (?)
                                                                         and r.warning IN (?)
                                                                         and floor((? - unix_timestamp(r.source_timestamp)) / ?) = 0
                                                                         and not t.deleted
                                                                       order by r.source_timestamp desc    `,
                                  values: [req.params.regionType, req.body.regions, req.body.hazards, req.body.sources,
                                           warningsValues(req.body.warnings),
                                           end, periodLengthInSeconds]
                              })).map(i => {
                i.json = JSON.parse(i.json);
                return i;
            });


        }, {duration: 60});
    });

    app.post("/map/:map/region-type/:regionType/geography", async (req, res) => {
        cache(res, null, async () => {
            try {

                const geography = await sql({
                                                // language=MySQL
                                                sql: `/* app.ts: geography */ select ST_AsGeoJSON(boundary) as geo, region, gr.title
                                                                              from ref_geo_regions gr,
                                                                                   ref_map_metadata mm
                                                                              where mm.id = ?
                                                                                and region_type = ?
                                                                                and gr.map_location = mm.location`,
                                                values: [req.params.map, req.params.regionType]


                                            });
                const regionGeoMap: RegionGeography = {};
                for (const row of geography) {
                    regionGeoMap[row.region] = JSON.parse(row.geo);
                    regionGeoMap[row.region]["properties"] = {name: row.region, title: row.title}
                }
                console.info("SUCCESS: Obtained geography.");
                return regionGeoMap;
            } catch (e) {
                console.error("FAILED: Could not get geography, hit this error ", e);
            }
        }, {duration: 24 * 60 * 60});
    });


    app.post("/map/:map/region-type/:regionType/region/:region/geography", async (req, res) => {
        cache(res, null, async () => {
            try {

                const geography = await sql({
                                                // language=MySQL
                                                sql: `/* app.ts: geography */ select ST_AsGeoJSON(boundary) as geo, region, gr.title
                                                                              from ref_geo_regions gr,
                                                                                   ref_map_metadata mm
                                                                              where mm.id = ?
                                                                                and region_type = ?
                                                                                and region = ?
                                                                                and gr.map_location = mm.location`,
                                                values: [req.params.map, req.params.regionType, req.params.region]


                                            });
                const result = JSON.parse(geography[0].geo);
                result["properties"] = {name: geography[0].region, title: geography[0].title}
                console.info("SUCCESS: Obtained geography.");
                return result;
            } catch (e) {
                console.error("FAILED: Could not get geography, hit this error ", e);
            }
        }, {duration: 24 * 60 * 60});
    });

    app.post("/map/:map/aggregations", async (req, res) => {

        cache(res, req.path, async () => {

            const aggregationTypes = await sql({
                                                   // language=MySQL
                                                   sql:                                                   `/* app.ts: aggregations */ select rat.id as region_aggregation_type_id, rat.title as title
                                                                                                                                      from ref_map_metadata_region_aggregations rmmra,
                                                                                                                                           ref_map_region_aggregation_types rat
                                                                                    where rat.id = rmmra.region_aggregation_type_id
                                                                                      and rmmra.map_id = ?`, values: [req.params.map]
                                               });


            const aggroMap: AggregationMap = {};
            for (const aggType of aggregationTypes) {
                aggroMap[aggType.region_aggregation_type_id] = {aggregates: []};

                const aggregations = await sql({
                                                   // language=MySQL
                                                   sql: `select distinct ram.region_aggregation_id as region_aggregation_id,
                                                                         ra.title                  as title
                                                         from ref_map_region_aggregation_mappings ram,
                                                              ref_map_region_aggregations ra
                                                         where ra.id = ram.region_aggregation_id
                                                           and ra.region_aggregation_type_id = ?`,
                                                   values: [aggType.region_aggregation_type_id]
                                               });
                for (const agg of aggregations) {
                    const aggregationMappings = await sql({
                                                              // language=MySQL
                                                              sql: `select distinct ram.region      as region,
                                                                                    ram.region_type as region_type
                                                                    from ref_map_region_aggregation_mappings ram
                                                                    where ram.region_aggregation_id = ?`,
                                                              values: [agg.region_aggregation_id]
                                                          });
                    const mappingsMap = {};
                    for (const aggMapping of aggregationMappings) {
                        if (!mappingsMap[aggMapping.region_type]) {
                            mappingsMap[aggMapping.region_type] = [];
                        }
                        mappingsMap[aggMapping.region_type].push(aggMapping.region);
                    }

                    aggroMap[aggType.region_aggregation_type_id].aggregates.push(
                        {id: agg.region_aggregation_id, title: agg.title, regionTypeMap: mappingsMap});
                }

            }


            return aggroMap;
        }, {duration: 24 * 60 * 60});
    });

    app.post("/map/:map/region-type/:regionType/recent-text-count", async (req, res) => {
        const lastDate: Date = (await maps)[req.params.map].last_date;
        const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());

        cache(res, req.path + ":" + JSON.stringify(req.body), async () => {
            const rows = await sql({
                                       // language=MySQL
                                       sql:    `/* app.ts: recent-text-count */ SELECT r.region AS region, count(*) AS count
                                                                                FROM mat_view_regions r
                                                                                WHERE r.region_type = ?
                                                                                  AND r.source_timestamp between ? and ?
                                                                                  AND r.hazard IN (?)
                                                                                  AND r.source IN (?)
                                                                                  AND r.warning IN (?)
                                                                                GROUP BY r.region
                                               `,
                                       values: [req.params.regionType, new Date(req.body.startDate),
                                                new Date(endDate), req.body.hazards, req.body.sources,
                                                warningsValues(req.body.warnings),]
                                   });
            const result = {};
            for (const row of rows) {
                result["" + row.region] = row.count;
            }
            return result;

        }, {duration: 60});


    });


    app.post("/map/:map/now", async (req, res) => {
        const lastDate: Date = (await maps)[req.params.map].last_date;
        const endDate: number = lastDate == null ? Date.now() : lastDate.getTime();
        res.json(endDate);
    });

    /**
     * Returns all the regions for a given map, regardless of region type.
     * IMPORTANT: this screens out numerically named regions.
     */
    app.post("/map/:map/regions", async (req, res) => {
        cache(res, req.path, async () => {
            return await sql({
                                 // language=MySQL
                                 sql: `/* app.ts: map regions */ select distinct region         as value,
                                                                                 gr.title       as text,
                                                                                 gr.region_type as type,
                                                                                 gr.level       as level
                                                                 from ref_geo_regions gr,
                                                                      ref_map_metadata mm
                                                                 where not region REGEXP '^[0-9]+$'
                                                                   and gr.map_location = mm.location
                                                                   and mm.id = ?
                                                                 order by level desc, text asc`,
                                 values: [req.params.map]
                             });
        }, {duration: 60 * 60});
    });


    /**
     * Returns all the regions for a given map, regardless of region type.
     * IMPORTANT: this screens out numerically named regions.
     */
    app.post("/map/:map/all-regions", async (req, res) => {
        cache(res, req.path, async () => {
            return await sql({
                                 // language=MySQL
                                 sql: `/* app.ts: map regions */ select distinct region         as value,
                                                                                 gr.title       as text,
                                                                                 gr.region_type as type,
                                                                                 gr.level       as level
                                                                 from ref_geo_regions gr,
                                                                      ref_map_metadata mm
                                                                 where gr.map_location = mm.location
                                                                   and mm.id = ?
                                                                 order by level desc, text asc`,
                                 values: [req.params.map]
                             });
        }, {duration: 60 * 60});
    });


    app.post("/map/:map/region-type/:regionType/regions", async (req, res) => {
        cache(res, req.path, async () => {
            const rows = await sql({
                                       // language=MySQL
                                       sql:                                                  `/* app.ts: regionType regions */ select region
                                                                                                                               from ref_geo_regions gr,
                                                                                                                                    ref_map_metadata mm
                                                                                                                               where gr.region_type = ?
                                                                                and gr.map_location = mm.location
                                                                                and mm.id = ?`,
                                       values: [req.params.regionType, req.params.map]
                                   });
            const result = [];
            for (const row of rows) {
                result.push(row.region);
            }
            return result;

        }, {duration: 24 * 60 * 60});
    });

    /**
     * Returns the data for a timeseries graph on the give map.
     * @example JSON body
     *
     * {
     *     "layer" : {
     *         "hazards" : ["flood","wind"]
     *         "sources" :["twitter"]
     *     },
     *     "regions":["wales","england"],
     *     "from": 1634911245041,
     *     "to": 1634911245041,
     * }
     *
     *
     */
    app.post("/map/:map/region-type/:regionType/stats", async (req, res) => {

        cache(res, req.path + ":" + JSON.stringify(req.body), async () => {

            const firstDateInSeconds = (await sql({
                                                      // language=MySQL
                                                      sql: `select unix_timestamp(max(source_timestamp)) as ts
                                                            from mat_view_first_entries
                                                            where hazard IN (?)
                                                              and source IN (?)`, values: [req.body.hazards, req.body.sources]
                                                  }))[0].ts
            console.debug("First date in seconds: " + firstDateInSeconds);
            const result = {};

            const lastDate: Date = (await maps)[req.params.map].last_date;
            const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
            const start = Math.floor(req.body.startDate / 1000);
            const end = Math.floor(endDate / 1000)
            //Th period length is also rounded to the hour to reduce the number of possible queries.
            const periodLengthInSeconds: number = Math.ceil(Math.min(end - start) / 3600) * 3600;
            const maxPeriods: number = (end - firstDateInSeconds) / periodLengthInSeconds;

            console.debug("Period Length in Seconds: " + periodLengthInSeconds);
            console.debug("StartDate: " + new Date(req.body.startDate));
            console.debug("EndDate: " + new Date(endDate));
            console.debug("Start: " + new Date(start * 1000));
            console.debug("End: " + new Date(end * 1000));

            const rows = await sql({
                                       // language=MySQL
                                       sql: `/* app.ts: stats */ select (select exceedance
                                                                         from (select cume_dist() OVER w * 100.0   as exceedance,
                                                                                      rhs.period                   as period,
                                                                                      IFNULL(lhs.count, rhs.count) as count
                                                                               from (SELECT count(source_id)                                    as count,
                                                                                            floor((? - unix_timestamp(r.source_timestamp)) / ?) as period

                                                                                     FROM mat_view_regions r
                                                                                     WHERE r.region = regions.region
                                                                                       and r.region_type = ?
                                                                                       and r.hazard IN (?)
                                                                                       and r.source IN (?)
                                                                                       and r.warning IN (?)
                                                                                       and not r.deleted
                                                                                     group by period
                                                                                     order by period
                                                                                    ) lhs
                                                                                        RIGHT OUTER JOIN (select value as period, 0 as count from ref_integers where value < ?) rhs
                                                                                                         ON lhs.period = rhs.period
                                                                                   WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)) x
                                                                         where period = 0
                                                                           and count > 0) as exceedance,
                                                                        (SELECT count(*) as count
                                                                         FROM mat_view_regions r
                                                                         WHERE r.region = regions.region
                                                                           and r.region_type = ?
                                                                           and r.hazard IN (?)
                                                                           and r.source IN (?)
                                                                           and r.warning IN (?)
                                                                           and not r.deleted
                                                                           and r.source_timestamp between ? and ?
                                                                        )                 as count,
                                                                        regions.region    as region

                                                                 from (select distinct region from ref_geo_regions where region_type = ?) as regions`,

                                       values: [end, periodLengthInSeconds,
                                                req.params.regionType, req.body.hazards, req.body.sources,
                                                warningsValues(req.body.warnings),
                                                maxPeriods,
                                                req.params.regionType, req.body.hazards, req.body.sources,
                                                warningsValues(req.body.warnings),
                                                new Date(req.body.startDate), new Date(req.body.endDate), req.params.regionType
                                       ]
                                   }, true);


            for (const row of rows) {
                if (req.body.debug) {
                    console.info("Fetching row ", row);
                }

                result["" + row.region] = {count: row.count, exceedance: row.exceedance};
            }

            return result;

        }, {duration: 5 * 60});

    });

    /**
     * Returns the data for a timeseries graph on the give map.
     * @example JSON body
     *
     * {
     *     "layer" : {
     *         "hazards" : ["flood","wind"]
     *         "sources" :["twitter"]
     *     },
     *     "regions":["wales","england"],
     *     "from": 1634911245041,
     *     "to": 1634911245041,
     * }
     *
     *
     */
    app.post("/map/:map/analytics/time", async (req, res) => {
        console.log("Query " + req.params.map, req.body);
        const lastDateInDB: any = (await maps)[req.params.map].last_date;
        const location: any = (await maps)[req.params.map].location;
        const key = req.params.map + ":" + JSON.stringify(req.body);
        const params: any = req.body;

        cache(res, key, async () => {
            let fullText = "";
            let textSearch: string = params.textSearch;
            //           concat(md5(concat(r.source, ':', r.hazard, ':', r.region)), ' ',
            if (typeof textSearch !== "undefined" && textSearch.length > 0) {
                fullText = " and MATCH (tsd.source_text) AGAINST(? IN BOOLEAN MODE) ";
                let additionalQuery = "+(";
                for (const source of params.layer.sources) {
                    for (const hazard of params.layer.hazards) {
                        for (const region of params.regions) {
                            additionalQuery += md5(source + ":" + hazard + ":" + region) + " ";
                        }
                    }
                }
                additionalQuery += ") ";
                textSearch = additionalQuery + "+(" + textSearch + ")";
                console.log("Ammended text search is '" + textSearch + "'");
            }
            const dayTimePeriod: boolean = params.timePeriod === "day";
            const timeSeriesTable = dayTimePeriod ? "mat_view_timeseries_date" : "mat_view_timeseries_hour";
            const dateTable = dayTimePeriod ? "mat_view_days" : "mat_view_hours";
            const from: Date = dateFromMillis(params.from);
            const to: Date = lastDateInDB ? dateFromMillis(Math.min(params.to, lastDateInDB.getTime())) : dateFromMillis(params.to);
            const hazards: string[] = params.layer.hazards;
            const sources: string[] = params.layer.sources;
            const regions: string[] = params.regions;
            if (!regions || regions.length === 0) {
                const values = fullText ? [hazards, sources, location, textSearch, from, to] : [hazards, sources, location, from, to];
                return await sql({
                                     // language=MySQL
                                     sql: `select *
                                           from (select IFNULL(lhs.count, rhs.count) as count,
                                                        'all'                        as region,
                                                        1.0 / (cume_dist() OVER w)   as exceedance,
                                                        lhs.date                     as date
                                                 from (SELECT count(*)        as count,
                                                              tsd.source_date as date

                                                       FROM ${timeSeriesTable} tsd
                                                       WHERE tsd.hazard IN (?)
                                                         and tsd.source IN (?)
                                                         and tsd.map_location = ? ${fullText}
                                                       group by date
                                                       order by date) lhs
                                                          RIGHT OUTER JOIN (select date, 0 as count
                                                                            from ${dateTable}) rhs
                                                                           ON lhs.date = rhs.date
                                                     WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                                                 order by date) x
                                           where date between ? and ?
                                           order by date `,
                                     values
                                 });
            } else {
                const values = fullText ? [regions, hazards, sources, location, textSearch, from, to] : [regions, hazards, sources,
                                                                                                         location, from, to];
                return await sql({
                                     // language=MySQL
                                     sql: `select *
                                           from (select IFNULL(lhs.count, rhs.count) as count,
                                                        region,
                                                        1.0 / (cume_dist() OVER w)   as exceedance,
                                                        lhs.date                     as date
                                                 from (SELECT count(tsd.source_date) as count,
                                                              tsd.source_date        as date,
                                                              tsd.region_group_name  as region
                                                       FROM ${timeSeriesTable} tsd
                                                       WHERE tsd.region_group_name IN (?)
                                                         and tsd.hazard IN (?)
                                                         and tsd.source IN (?)
                                                         and tsd.map_location = ? ${fullText}
                                                       group by date, region
                                                       order by date
                                                      ) lhs
                                                          RIGHT OUTER JOIN (select date, 0 as count from ${dateTable}) rhs
                                                                           ON lhs.date = rhs.date
                                                     WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                                                ) x
                                           where date between ? and ?
                                           order by date`, values
                                 });
            }
        }, {duration: 60 * 60});
    });


    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }


    app.listen(3000, () => {
        console.log("App started");
    });

    // Export the app object. When executing the application local this does nothing. However,
    // to port it to AWS Lambda we will create a wrapper around that will load the app from
    // this file
    return app;
};
