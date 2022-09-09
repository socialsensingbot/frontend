/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {functionLookup, MapFunctionName, MapFunctionRequest, callFunction} from "socialsensing-api/map-queries";

// bump 87
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

// declare a new express app
const app = express();
app.use(bodyParser.json() as any);
app.use(awsServerlessExpressMiddleware.eventContext());

app.use((req, res, next) => {
    // Enable CORS for all methods
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.setHeader("X-SocialSensing", "true");
    res.setHeader("X-SocialSensing-Date", "" + new Date());
    next();
});

/*
 app.post("/map/regions", regionsFunc);
 app.get("/map/regions", regionsFunc);
 */


app.get("/map/response/:key", (req, res) => callFunction("from-cache", req, res));
app.post("/map/metadata", (req, res) => callFunction("map-metadata", req, res));
app.get("/map/metadata", (req, res) => callFunction("map-metadata", req, res));

app.get("/map/:map/metadata", (req, res) => callFunction("map-metadata-by-id", req, res));
app.post("/map/:map/metadata", (req, res) => callFunction("map-metadata-by-id", req, res));

app.post("/map/text/:source/:id", (req, res) => callFunction("text", req, res, false));
app.get("/map/text/:source/:id", (req, res) => callFunction("text", req, res, false));
app.post("/map/:map/region-type/:regionType/text-for-regions", (req, res) => callFunction("text-for-regions", req, res, false, true));

app.post("/map/:map/region-type/:regionType/text-for-public-display",
         (req, res) => callFunction("text-for-public-display", req, res, true));

app.post("/map/:map/region-type/:regionType/csv-export", (req, res) => callFunction("csv-export", req, res, true));

app.get("/map/:map/region-type/:regionType/geography", (req, res) => callFunction("geography", req, res));
app.post("/map/:map/region-type/:regionType/geography", (req, res) => callFunction("geography", req, res, true));

app.post("/map/:map/region-type/:regionType/region/:region/geography", (req, res) => callFunction("region-geography", req, res, true));
app.get("/map/:map/region-type/:regionType/region/:region/geography", (req, res) => callFunction("region-geography", req, res));

app.post("/map/:map/aggregations", (req, res) => callFunction("map-aggregations", req, res));
app.get("/map/:map/aggregations", (req, res) => callFunction("map-aggregations", req, res));

app.post("/map/:map/region-type/:regionType/recent-text-count", (req, res) => callFunction("recent-text-count", req, res, false));


app.post("/map/:map/now", (req, res) => callFunction("now", req, res, false, false));
app.get("/map/:map/now", (req, res) => callFunction("now", req, res, false, false));

/**
 * Returns all the regions for a given map, regardless of region type.
 * IMPORTANT: this screens out numerically named regions.
 */
app.post("/map/:map/regions", (req, res) => callFunction("map-regions", req, res));
app.get("/map/:map/regions", (req, res) => callFunction("map-regions", req, res));


/**
 * Returns all the regions for a given map, regardless of region type.
 * IMPORTANT: this screens out numerically named regions.
 */
app.get("/map/:map/all-regions", (req, res) => callFunction("all-map-regions", req, res));
app.post("/map/:map/all-regions", (req, res) => callFunction("all-map-regions", req, res));

app.post("/map/:map/region-type/:regionType/regions", (req, res) => callFunction("regions-by-type", req, res));
app.get("/map/:map/region-type/:regionType/regions", (req, res) => callFunction("regions-by-type", req, res));

/**
 * Returns the data to show the exceedance AND counts on the main map. This is a highly optimized version
 * of the 'complex-stats' call. It makes a lot of assumptions AND allows only the simple enumerated AND boolean
 * criteria of hazards, sources AND warning.
 *
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *         "warnings": "include"
 *     },
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
app.post("/map/:map/region-type/:regionType/stats", (req, res) => callFunction("stats", req, res, true));


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
app.post("/map/:map/region-type/:regionType/accurate-stats", (req, res) => callFunction("accurate-stats", req, res, true));


/**
 * Returns the data for a timeslider on the map.
 *
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *     },
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
app.post("/map/:map/timeslider", (req, res) => callFunction("timeslider", req, res, true));


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
app.post("/map/:map/analytics/time", (req, res) => callFunction("timeseries", req, res, true));


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
module.exports = app;
