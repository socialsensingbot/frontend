/* tslint:disable:no-console */
import * as express from "express";
import * as bodyParser from "body-parser";
import {
    accurateStatsFunc,
    allMapRegionsFunc,
    geographyFunc,
    mapMetadataFunc,
    mapRegionsFunc,
    metadataForMapByIDFunc,
    nowFunc,
    recentTextCountFunc,
    regionGeographyFunc,
    regionsForRegionTypeFunc,
    statsFunc,
    textForRegionsFunc,
    timeseriesFunc
} from "socialsensing-api/map-queries";

//bump 4
const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
module.exports = () => {

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


    app.post("/map/metadata", mapMetadataFunc);
    app.get("/map/metadata", mapMetadataFunc);

    app.get("/map/:map/metadata", metadataForMapByIDFunc);
    app.post("/map/:map/metadata", metadataForMapByIDFunc);

    app.post("/map/:map/region-type/:regionType/text-for-regions", textForRegionsFunc);

    app.get("/map/:map/region-type/:regionType/geography", geographyFunc);
    app.post("/map/:map/region-type/:regionType/geography", geographyFunc);

    app.post("/map/:map/region-type/:regionType/region/:region/geography", regionGeographyFunc);
    app.get("/map/:map/region-type/:regionType/region/:region/geography", regionGeographyFunc);

    app.post("/map/:map/region-type/:regionType/recent-text-count", recentTextCountFunc);


    app.post("/map/:map/now", nowFunc);

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
    return app;
};
