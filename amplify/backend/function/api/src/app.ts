/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {
   callFunction
} from "socialsensing-api/map-queries";

//bump 13


// declare a new express app
const app = express();
app.use(bodyParser.json() as any);
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
    app.use(awsServerlessExpressMiddleware.eventContext());
}

app.use((req, res, next) => {
    // Enable CORS for all methods
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.setHeader("X-SocialSensing", "true");
    res.setHeader("X-SocialSensing-Date", "" + new Date());
    next();
});


/**
 * Returns the global metadata. Including all the metadata for individual maps.
 */
app.post("/v1/map/metadata", (req, res) => callFunction("map-metadata", req, res));
app.get("/v1/map/metadata", (req, res) => callFunction("map-metadata", req, res));

/**
 * Returns the time according to the API. I.e. the date of the last processed data. Kept for completeness/testing, probably not going to be
 * used by customers.
 */
app.get("/v1/map/:map/now", (req, res) => callFunction("now", req, res));
app.post("/v1/map/:map/now", (req, res) => callFunction("now", req, res));


/**
 * Returns the metadata for a given map.
 */
app.get("/v1/map/:map/metadata", (req, res) => callFunction("map-metadata-by-id", req, res));
app.post("/v1/map/:map/metadata", (req, res) => callFunction("map-metadata", req, res));

/**
 * Returns the Tweets (or any other form of text based message) for a given region and regionType.
 */
app.post("/v1/map/:map/text", (req, res) => callFunction("text-for-regions", req, res));

/**
 * Returns the text for a given source and source id.
 */
app.post("/v1/map/:map/text/:source/:id", (req, res) => callFunction("text", req, res));

/**
 * Returns the data to show the exceedance AND counts on the main map. This is a highly optimized version
 * of the 'complex-stats' call. It makes a lot of assumptions AND allows only the simple enumerated AND boolean
 * criteria of hazards, sources AND warning.
 *
 */
app.post("/v1/map/:map/stats", (req, res) => callFunction("stats", req, res));

/**
 * Returns the geography in GeoJSON for a given region of a regionType.
 */
app.get("/v1/map/:map/region-type/:regionType/region/:region/geography", (req, res) => callFunction("region-geography", req, res));


/**
 * Returns the geography in GeoJSON for all regions of a regionType.
 */
app.get("/v1/map/:map/region-type/:regionType/geography", (req, res) => callFunction("geography", req, res));


app.post("/v1/map/:map/recent-text-count", (req, res) => callFunction("recent-text-count", req, res));

/**
 * Returns all the regions for a given map, regardless of region type.
 * IMPORTANT: this screens out numerically named regions.
 */
app.get("/v1/map/:map/regions", (req, res) => callFunction("all-map-regions-api", req, res));

app.get("/v1/map/:map/region-type/:regionType/regions", (req, res) => callFunction("regions-by-type", req, res));


/**
 * Returns the data for a timeseries graph on the give map.
 * @example JSON body
 *
 * {
 *     "hazards" : ["flood","wind"]
 *     "sources" :["twitter"]
 *     "regions":["wales","england"],
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
app.post("/v1/map/:map/analytics/time", (req, res) => callFunction("timeseries", req, res));


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    app.listen(3000, () => {
        console.log("App started");
    });
}


// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
