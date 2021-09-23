/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {queries} from "./queries";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";
import {AggregationMap, MapMetadata, RegionGeography, ServiceMetadata} from "./map-data";
import {TwitterApi} from "twitter-api-v2";
import {Pool} from "mysql";

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
module.exports = (connection: Pool, twitter: TwitterApi) => {


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
        if (queryCache.has(key)) {
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
                queryCache.set(key, result, options.duration);
                res.json(result);
            }).catch(e => handleError(res, e));
        }
    };

    app.post("/query/:name", async (req, res) => {
        console.log("Query " + req.params.name, req.body);
        const key = req.params.name + ":" + JSON.stringify(req.body);
        cache(res, key, async () => {
            if (!queryMap) {
                queryMap = queries;
            }
            console.log(queryMap[req.params.name]);
            return await sql((queryMap[req.params.name])(req.body));
        });
    });

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
                                  sql: `select t.source_json            as json,
                                               t.source_html            as html,
                                               r.source_timestamp       as timestamp,
                                               r.source_id              as id,
                                               ST_AsGeoJSON(t.location) as location,
                                               r.region                 as region
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
        cache(res, req.path, async () => {


            const geography = await sql({
                                            // language=MySQL
                                            sql: `select ST_AsGeoJSON(boundary) as geo, region
                                                  from ref_geo_regions gr,
                                                       ref_map_metadata mm
                                                  where gr.map_location = mm.location
                                                    and mm.id = ?
                                                    and region_type = ?`, values: [req.params.map, req.params.regionType]
                                        });
            const regionGeoMap: RegionGeography = {};
            for (const row of geography) {
                regionGeoMap[row.region] = JSON.parse(row.geo);
            }
            return regionGeoMap;
        }, {duration: 24 * 60 * 60});
    });

    app.post("/map/:map/aggregations", async (req, res) => {

        cache(res, req.path, async () => {

            const aggregationTypes = await sql({
                                                   // language=MySQL
                                                   sql: `select rat.id as region_aggregation_type_id, rat.title as title
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
                                       sql:    `select r.region as region, count(*) as count
                                                FROM live_text t,
                                                     mat_view_regions r
                                                WHERE t.source = r.source
                                                  and t.hazard = r.hazard
                                                  and r.source_id = t.source_id
                                                  and r.region_type = ?
                                                  and r.source_timestamp between ? and ?
                                                  and r.hazard IN (?)
                                                  and r.source IN (?)
                                                  and r.warning IN (?)
                                                group by r.region
                                               `,
                                       values: [req.params.regionType, req.body.layerGroup, new Date(req.body.startDate),
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

    app.post("/map/:map/region-type/:regionType/regions", async (req, res) => {
        cache(res, req.path, async () => {
            const rows = await sql({
                                       // language=MySQL
                                       sql: `select region
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


    async function getCachedStats(end: number, periodLengthInSeconds: number, req): Promise<any[]> {
        return await sql({
                             // language=MySQL
                             sql: `select *
                                   from cache_stats_calc
                                   where end_time = ?
                                     and period_length = ?
                                     and region_type = ?
                                     and hazards = ?
                                     and sources = ?
                                     and warnings = ?`,
                             values: [end, periodLengthInSeconds,
                                      req.params.regionType, req.body.hazards.join(","), req.body.sources.join("?"),
                                      req.body.warnings,
                             ]
                         }, true);
    }

    app.post("/map/:map/region-type/:regionType/stats", async (req, res) => {

        cache(res, req.path + ":" + JSON.stringify(req.body), async () => {
            const result = {};

            const lastDate: Date = (await maps)[req.params.map].last_date;
            const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
            const start = Math.floor(req.body.startDate / 1000);
            const end = Math.floor(endDate / 1000);
            const periodLengthInSeconds: number = end - start;
            console.debug("Period Length in Seconds: " + periodLengthInSeconds);
            console.debug("StartDate: " + new Date(req.body.startDate));
            console.debug("EndDate: " + new Date(endDate));
            console.debug("Start: " + new Date(start * 1000));
            console.debug("End: " + new Date(end * 1000));
            let rows = await getCachedStats(end, periodLengthInSeconds, req);
            if (rows.length === 0) {
                // console.log("Test Values: ", testValues);
                try {
                    await sql({
                                  // language=MySQL
                                  sql: `insert into cache_stats_calc(exceedance, count, region, end_time, period_length, region_type,
                                                                     hazards,
                                                                     sources, warnings)
                                        select (select exceedance
                                                from (SELECT count(*)                                            as count,
                                                             floor((? - unix_timestamp(r.source_timestamp)) / ?) as period,
                                                             cume_dist() OVER w * 100.0                          as exceedance

                                                      FROM mat_view_regions r
                                                      WHERE r.region_type = ?
                                                        and r.region = regions.region
                                                        and r.hazard IN (?)
                                                        and r.source IN (?)
                                                        and r.warning IN (?)
                                                      group by period
                                                          WINDOW w AS (ORDER BY COUNT(period) desc))
                                                         as x
                                                where period = 0) as exceedance,
                                               (SELECT count(*) as count
                                                FROM mat_view_regions r
                                                WHERE r.region_type = ?
                                                  and r.region = regions.region
                                                  and r.hazard IN (?)
                                                  and r.source IN (?)
                                                  and r.warning IN (?)
                                                  and r.source_timestamp between ? and ?
                                               )                  as count,
                                               regions.region     as region,
                                               ?                  as end_time,
                                               ?                  as period_length,
                                               ?                  as region_type,
                                               ?                  as hazards,
                                               ?                  as sources,
                                               ?                  as warnings
                                        from (select distinct region_id as region from ref_map_regions where region_type_id = ?) as regions`,
                                  values: [end, periodLengthInSeconds,
                                           req.params.regionType, req.body.hazards, req.body.sources,
                                           warningsValues(req.body.warnings),
                                           req.params.regionType, req.body.hazards, req.body.sources,
                                           warningsValues(req.body.warnings),
                                           new Date(req.body.startDate), new Date(req.body.endDate),
                                           end, periodLengthInSeconds,
                                           req.params.regionType, req.body.hazards.join(","), req.body.sources.join(","),
                                           req.body.warnings, req.params.regionType
                                  ]
                              }, true);
                } catch (e) {
                    console.warn(e);
                }
                // todo: I know this is awful but I can't figure out why the previous INSERT is not immediately available.
                await sleep(100);
                rows = await getCachedStats(end, periodLengthInSeconds, req);
            }

            for (const row of rows) {
                if (req.body.debug) {
                    console.info("Fetching row ", row);
                }

                result["" + row.region] = {count: row.count, exceedance: row.exceedance};
            }

            return result;

        }, {duration: 1 * 60});

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
