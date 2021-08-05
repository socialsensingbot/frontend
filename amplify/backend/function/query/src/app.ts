import * as express from "express";
import * as bodyParser from "body-parser";
import {queries} from "./queries";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";
import {TypeCast} from "mysql";
import {AggregationData, AggregationMap, AggregationRegion, MapMetadata, RegionGeography, ServiceMetadata} from "./map-data";
import {Language} from "@amcharts/amcharts4/core";

const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: true});

const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.substring("query-".length);
console.log("STAGE: " + stage);
const dev = stage === "dev";
// Load modules
const mysql = require("mysql");

// Initialising the instance
const connection = mysql.createPool({
                                        connectionLimit: 50,
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

function runQuery(name: string, req, res, data, transform: (i: any) => any = i => i): void {
    const key = name + ":" + JSON.stringify(data);
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
        return;
    } else {
        console.log("Retrieving query for " + key);
        connection.query((queryMap[name])(data),
                         (results, error) => {
                             if (error) {
                                 res.json({error: error.message, details: JSON.stringify(error)});
                             } else {
                                 res.setHeader("X-SocialSensing-CachedQuery", "false");
                                 queryCache.set(key, results);
                                 console.log("Added to cache " + key);
                                 res.json(transform(results));
                             }
                         });
    }
}

const cache = (res, key: string, value: () => Promise<any>, options: { aggresive?: boolean } = {aggresive: true}) => {
    if (queryCache.has(key)) {
        console.log("Returned from cache " + key);
        res.setHeader("X-SocialSensing-CachedQuery", "true");
        res.setHeader("X-SocialSensing-CachedQuery-TTL", queryCache.getTtl(key));
        res.setHeader("X-SocialSensing-CachedQuery-Expires-In", queryCache.getTtl(key) - Date.now());
        res.json(queryCache.get(key));
        return;
    } else {
        console.log("Retrieving query for " + key);

        res.setHeader("X-SocialSensing-CachedQuery", "false");
        value().then(result => {
            queryCache.set(key, result, options.aggresive ? 24 * 60 * 60 : 60 * 60);
            res.json(result);
        }).catch(e => handleError(res, e));
    }
};

app.post("/query/:name", async (req, res) => {
    runQuery(req.params.name, req, res, req.body);
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

app.post("/map/:map/region-type/:regionType/tweets-for-regions", async (req, res) => {
    runQuery("region-type-tweets-for-regions", req, res,
             {map: req.params.map, regionType: req.params.regionType, regions: req.body.regions});
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
    });
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
    });
});

app.post("/map/:map/region-type/:regionType/recent-tweets", async (req, res) => {
    runQuery("region-type-recent-tweets", req, res, {map: req.params.map, regionType: req.params.regionType});
});

app.post("/map/:map/region-type/:regionType/regions", async (req, res) => {
    runQuery("region-type-regions", req, res, {map: req.params.map, regionType: req.params.regionType});
});

app.post("/map/:map/region-type/:regionType/regions-with-data", async (req, res) => {
    runQuery("region-type-regions-with-data", req, res, {map: req.params.map, regionType: req.params.regionType});
});


app.post("/map/:map/region-type/:regionType/region/:region/stats", async (req, res) => {
    runQuery("region-type-regions", req, res, {map: req.params.map, regionType: req.params.regionType});
});


// app.get('/query/:name/*', function(req, res) {
//   // Add your code here
//   res.json({success: 'get call succeed!', url: req.url});
// });
//
//
// /****************************
// * Example post method *
// ****************************/

// app.post('/query/:name', function(req, res) {
//   // Add your code here
//   res.json({success: 'post call succeed!', url: req.url, body: req.body})
// });

// app.post('/query/:name/*', function(req, res) {
//   // Add your code here
//   res.json({success: 'post call succeed!', url: req.url, body: req.body})
// });
//
// /****************************
// * Example put method *
// ****************************/
//
// app.put('/query/:name', function(req, res) {
//   // Add your code here
//   res.json({success: 'put call succeed!', url: req.url, body: req.body})
// });
//
// app.put('/query/:name/*', function(req, res) {
//   // Add your code here
//   res.json({success: 'put call succeed!', url: req.url, body: req.body})
// });
//
// /****************************
// * Example delete method *
// ****************************/
//
// app.delete('/query/:name', function(req, res) {
//   // Add your code here
//   res.json({success: 'delete call succeed!', url: req.url});
// });
//
// app.delete('/query/:name/*', function(req, res) {
//   // Add your code here
//   res.json({success: 'delete call succeed!', url: req.url});
// });

app.listen(3000, () => {
    console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
