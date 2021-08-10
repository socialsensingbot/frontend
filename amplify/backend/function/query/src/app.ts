import * as express from "express";
import * as bodyParser from "body-parser";
import {queries} from "./queries";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";
import {AggregationMap, MapMetadata, RegionGeography, ServiceMetadata} from "./map-data";

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
const mysql = require("mysql");

// Initialising the instance
const connection = mysql.createPool({
                                        connectionLimit: 10,
                                        host:            "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                        user:            "admin",
                                        password:        "4dRV2eh9t68Akfj",
                                        database:        "socialsensing",
                                        charset:         "utf8mb4",
                                        // multipleStatements: true,
                                        // connectTimeout: 15000,
                                        // acquireTimeout: 10000,
                                        waitForConnections: true,
                                        queueLimit:         5000,
                                        debug:              false
                                    });


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


// Analytics Queries

app.get("/query/:name", async (req, res) => {
    return res.status(405).json({error: "GET is not supported for queries, use POST instead."});
});

const cache = (res, key: string, value: () => Promise<any>, options: { duration: number } = {duration: 60}) => {
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
    const key = req.params.name + ":" + JSON.stringify(req.body);
    if (!queryMap) {
        queryMap = queries;
    }
    console.log(queryMap[req.params.name]);
    res.setHeader("X-SocialSensing-CachedQuery-Key", key);
    if (queryCache.has(key)) {
        console.log("Returned from cache " + key);
        res.setHeader("X-SocialSensing-CachedQuery", "true");
        res.setHeader("X-SocialSensing-CachedQuery-TTL", queryCache.getTtl(key));
        res.json(queryCache.get(key));

    } else {
        console.log("Retrieving query for " + key);
        connection.query((queryMap[req.params.name])(req.body),
                         (error, results) => {
                             if (error) {
                                 handleError(res, error);
                             } else {
                                 res.setHeader("X-SocialSensing-CachedQuery", "false");
                                 queryCache.set(key, results);
                                 console.log("Added to cache " + key);
                                 res.json(results);
                             }
                         });
    }
});

app.get("/refdata/:name", (req, res) => {
    if (!metadata) {
        metadata = new QueryMetadataSets(connection);
    }
    metadata[req.params.name].then(results => res.json(results))
                             .catch(error => {
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
                                 return res.json({error: error.message, details: JSON.stringify(error)});
                             });
});

const sql = async (options: {
    sql: string;
    values?: any;
}): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        connection.query(options, (error, results) => {
            if (error) {
                console.error(error);
                reject(error);
            } else {
                console.log(options.sql, options.values, results);
                resolve(results);
            }
        });
    });
};


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

app.post("/map/:map/metadata", async (req, res) => {
    cache(res, req.path, async () => {


        const map = await getMap(req.params.map);

        // const hazards = await sql({
        //                               // language=MySQL
        //                               sql: `select hazard
        //                                 from ref_map_metadata_hazards
        //                                 where map_id = ?`, values: [req.params.map]
        //                           });

        const layers = await sql({
                                     // language=MySQL
                                     sql: `select l.id as id, source, hazard
                                           from ref_map_metadata_layer_groups mlg,
                                                ref_map_layer_groups_mapping lgm,
                                                ref_map_layer_groups lg,
                                                ref_map_layers l
                                           where l.id = lgm.layer_id
                                             and lg.id = lgm.layer_group_id
                                             and mlg.layer_group_id = lgm.layer_group_id
                                             and mlg.map_id = ?`, values: [req.params.map]
                                 });

        const regionTypes = await sql({
                                          // language=MySQL
                                          sql: `select region_id as id, title
                                                from ref_map_metadata_region_types
                                                where map_id = ?`, values: [req.params.map]
                                      });

        const layerGroups = await sql({
                                          // language=MySQL
                                          sql: `select mlg.layer_group_id as id, title
                                                from ref_map_metadata_layer_groups mlg,
                                                     ref_map_layer_groups lg
                                                where mlg.layer_group_id = lg.id
                                                  and mlg.map_id = ?`, values: [req.params.map]
                                      });

        for (const layerGroup of layerGroups) {
            const layerGroupLayers = await sql({
                                                   // language=MySQL
                                                   sql: `select title
                                                         from ref_map_layer_groups_mapping lgm,
                                                              ref_map_layer_groups lg
                                                         where lgm.layer_id = lg.id
                                                           and lgm.layer_group_id = ?`, values: [layerGroup.id]
                                               });
            layerGroup.layers = layerGroupLayers.map(j => j.title);
        }


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
            layers,
            layerGroups,
            regionTypes,
            regionAggregations,
            defaultLayerGroup: map.default_layer_group,
            defaultRegionType: map.default_region_type,
            start:             {
                lat:  map.start_lat,
                lng:  map.start_lng,
                zoom: map.start_zoom
            }
        } as MapMetadata;

    });

});

app.post("/map/:map/region-type/:regionType/text-for-regions", async (req, res) => {

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
                                                                     ram.region_type           as region_type,
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
                    {id: agg.region_agregation_id, title: agg.title, regionTypeMap: mappingsMap});
            }

        }

        return aggroMap;
    }, {duration: 24 * 60 * 60});
});

app.post("/map/:map/region-type/:regionType/recent-text-count", async (req, res) => {

    cache(res, req.path + ":" + JSON.stringify(req.body), async () => {
        const rows = await sql({
                                   // language=MySQL
                                   sql:    `select tr.region as region, count(*) as count
                                            FROM live_text t,
                                                 live_text_regions tr,
                                                 ref_map_layer_groups_mapping lgm,
                                                 ref_map_layers l
                                            WHERE t.source = l.source
                                              and t.hazard = l.hazard
                                              and l.id = lgm.layer_id
                                              and tr.source = t.source
                                              and tr.source_id = t.source_id
                                              and tr.region_type = ?
                                              and lgm.layer_group_id = ?
                                              and t.source_date between ? and ?
                                            group by tr.region
                                           `,
                                   values: [req.params.regionType, req.body.layerGroup, dateFromMillis(req.body.startDate),
                                            dateFromMillis(req.body.endDate)]
                               });
        const result = {};
        for (const row of rows) {
            result[row.region] = row.count;
        }
        return result;

    }, {duration: 60});


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

// app.post("/map/:map/region-type/:regionType/regions-with-data", async (req, res) => {
//     return sql({
//                    // language=MySQL
//                    sql: `select *
//                          from (SELECT count(*)                      as count,
//                                       DATE(source_date)             as date,
//                                       (select count(*) from (select distinct date(source_date) from live_text) x) /
//                                       (rank() OVER w)               as exceedance,
//                                       1.0 / (percent_rank() OVER w) as inv_percent
//                                FROM live_text,
//                                     ref_map_layer_groups_mapping lgm,
//                                     ref_map_layers l
//                                WHERE source = l.source
//                                  and hazard = l.hazard
//                                  and l.id = lgm.layer_id
//                                  and lgm.layer_group_id = ?
//                                  and region_1 IN (?)
//                                group by DATE(source_date)
//                                    WINDOW w AS (ORDER BY COUNT(DATE(source_date)) desc)
//                                order by source_date) x
//                          where date between ? and ? `,
//                    values: [req.body.layerGroup, req.params.regions, dateFromMillis(req.body.startDate),
// dateFromMillis(req.body.endDate)] }); });


app.post("/map/:map/region-type/:regionType/stats", async (req, res) => {

    cache(res, req.path + ":" + req.body.layerGroup + ":" + Math.round(req.body.startDate / (60 * 1000)) + ":" + Math.round(
        req.body.endDate / (60 * 1000)), async () => {
        const result = {};

        // language=MySQL
        const aggregateSQL = (column) => `select ${column}
                                          from (SELECT count(*)                                       as count,
                                                       round(unix_timestamp(source_timestamp) / ?, 0) as period,
                                                       cume_dist() OVER w * 100.0                     as exceedance
                                                FROM live_text t,
                                                     live_text_regions tr,
                                                     ref_map_layer_groups_mapping lgm,
                                                     ref_map_layers l
                                                WHERE t.source = l.source
                                                  and t.hazard = l.hazard
                                                  and l.id = lgm.layer_id
                                                  and lgm.layer_group_id = ?
                                                  and tr.source = t.source
                                                  and tr.source_id = t.source_id
                                                  and tr.region_type = ?
                                                  and tr.region = regions.region
                                                group by period
                                                    WINDOW w AS (ORDER BY COUNT(period) desc))
                                                   as x
                                          where period = ?`;

        const periodLengthInSeconds: number = Math.round((req.body.endDate - req.body.startDate) / 1000);
        const targetPeriod: number = Math.round(Math.round(req.body.startDate / 1000) / periodLengthInSeconds);
        //
        // const testValues = await sql({
        //                            // language=MySQL
        //                            sql: `SELECT count(*)                                       as count,
        //                                               round(unix_timestamp(source_timestamp) / ?, 0) as period,
        //                                               cume_dist()  OVER w * 100                             as exceedance
        //                                        FROM live_text t,
        //                                             ref_map_layer_groups_mapping lgm,
        //                                             ref_map_layers l
        //                                        WHERE t.source = l.source
        //                                          and t.hazard = l.hazard
        //                                          and l.id = lgm.layer_id
        //                                          and lgm.layer_group_id = ?
        //                                          and region_1 = 'greater london'
        //                                        group by period
        //                                            WINDOW w AS (ORDER BY COUNT(period) desc) `,
        //
        //                            values: [periodLengthInSeconds, req.body.layerGroup]
        //                        });

        console.debug("Period Length in Seconds: " + periodLengthInSeconds);
        console.debug("Target period: " + targetPeriod);
        // console.log("Test Values: ", testValues);
        const rows = await sql({
                                   // language=MySQL
                                   sql:    `select (${aggregateSQL("exceedance")}) as exceedance,
                                                   (${aggregateSQL("count")})      as count,
                                                   regions.region                  as region
                                            from (select distinct region from live_text_regions where region_type = ?) as regions
                                           `,
                                   values: [periodLengthInSeconds, req.body.layerGroup,  req.params.regionType, targetPeriod,
                                            periodLengthInSeconds, req.body.layerGroup,  req.params.regionType, targetPeriod, req.params.regionType
                                   ]
                               });

        for (const row of rows) {
            console.info("Fetching row ", row);

            if (rows.length !== 0) {
                result[row.region] = {count: row.count, exceedance: row.exceedance};
            }


        }

        return result;

    }, {duration: 60});

});


app.listen(3000, () => {
    console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
