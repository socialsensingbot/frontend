/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {
    accurateStatsFunc,
    allMapRegionsFunc,
    csvExportFunc,
    geographyFunc,
    mapAggregationsFunc,
    mapMetadataFunc,
    mapRegionsFunc,
    metadataForMapByIDFunc,
    nowFunc,
    recentTextCountFunc,
    regionGeographyFunc,
    regionsForRegionTypeFunc,
    statsFunc,
    textForPublicDisplayFunc,
    textForRegionsFunc,
    timeseriesFunc,
    timesliderFunc
} from "socialsensing-api/map-queries";

//bump 17

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

app.post("/map/metadata", mapMetadataFunc);
app.get("/map/metadata", mapMetadataFunc);

app.get("/map/:map/metadata", metadataForMapByIDFunc);
app.post("/map/:map/metadata", metadataForMapByIDFunc);

app.post("/map/:map/region-type/:regionType/text-for-regions", textForRegionsFunc);

app.post("/map/:map/region-type/:regionType/text-for-public-display", textForPublicDisplayFunc);

app.post("/map/:map/region-type/:regionType/csv-export", csvExportFunc);

app.get("/map/:map/region-type/:regionType/geography", geographyFunc);
app.post("/map/:map/region-type/:regionType/geography", geographyFunc);

app.post("/map/:map/region-type/:regionType/region/:region/geography", regionGeographyFunc);
app.get("/map/:map/region-type/:regionType/region/:region/geography", regionGeographyFunc);

app.post("/map/:map/aggregations", mapAggregationsFunc);
app.get("/map/:map/aggregations", mapAggregationsFunc);

app.post("/map/:map/region-type/:regionType/recent-text-count", recentTextCountFunc);


app.post("/map/:map/now", nowFunc);
app.get("/map/:map/now", nowFunc);

/**
 * Returns all the regions for a given map, regardless of region type.
 * IMPORTANT: this screens out numerically named regions.
 */
app.post("/map/:map/regions", mapRegionsFunc);
app.get("/map/:map/regions", mapRegionsFunc);


/**
 * Returns all the regions for a given map, regardless of region type.
 * IMPORTANT: this screens out numerically named regions.
 */
app.get("/map/:map/all-regions", allMapRegionsFunc);
app.post("/map/:map/all-regions", allMapRegionsFunc);

app.post("/map/:map/region-type/:regionType/regions", regionsForRegionTypeFunc);
app.get("/map/:map/region-type/:regionType/regions", regionsForRegionTypeFunc);

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
app.post("/map/:map/region-type/:regionType/stats", statsFunc);


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
app.post("/map/:map/region-type/:regionType/accurate-stats", accurateStatsFunc);


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
app.post("/map/:map/timeslider", timesliderFunc);


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
app.post("/map/:map/analytics/time", timeseriesFunc);


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
