import * as express from "express";
import * as bodyParser from "body-parser";
import {queries} from "./queries";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";

const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: true});

const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.substring("query-".length);
console.log("STAGE: " + stage);
// Load modules
const PoolManager = require("mysql-connection-pool-manager");

const options = {
  idleCheckInterval:    1000,
  maxConnextionTimeout: 30000,
  idlePoolTimeout:      3000,
  errorLimit:           5,
  preInitDelay:         50,
  sessionTimeout:       60000,
  onConnectionAcquire:  () => { console.log("Acquire"); },
  onConnectionConnect:  () => { console.log("Connect"); },
  onConnectionEnqueue:  () => { console.log("Enqueue"); },
  onConnectionRelease:  () => { console.log("Release"); },
  mySQLSettings:        {
    host:     "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
    user:     "admin",
    password: "4dRV2eh9t68Akfj",
    database: "socialsensing",
    charset:  "utf8mb4",
    // multipleStatements: true,
    // connectTimeout: 15000,
    // acquireTimeout: 10000,
    waitForConnections: true,
    connectionLimit:    50,
    queueLimit:         5000,
    debug:              false
  }
};

// Initialising the instance
const connection = PoolManager(options);


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
/**********************
 * Example get method *
 **********************/

app.get("/query/:name", async (req, res) => {
  return res.status(405).json({error: "GET is not supported for queries, use POST instead."});
});

app.post("/query/:name", async (req, res) => {
  if (!queryMap) {
    queryMap = queries;
  }
  console.log(queryMap[req.params.name]);
  const key = req.params.name + ":" + JSON.stringify(req.body);
  res.setHeader("X-SocialSensing-CachedQuery-Key", key);
  if (queryCache.has(key)) {
    console.log("Returned from cache " + key);
    res.setHeader("X-SocialSensing-CachedQuery", "true");
    res.setHeader("X-SocialSensing-CachedQuery-TTL", queryCache.getTtl(key));
    res.json(queryCache.get(key));
    return;
  } else {
    console.log("Retrieving query for " + key);
    connection.query((queryMap[req.params.name])(req.body),
                     (results, error) => {
                       if (error) {
                         res.json({error: error.message, details: JSON.stringify(error)});
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
