/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


import * as express from "express";
import * as bodyParser from "body-parser";
import {queries} from "./queries";
import {QueryMetadataSets} from "./metdata";
import * as NodeCache from "node-cache";

const awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");

const queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: false});
const locationCache = new NodeCache({stdTTL: 7 * 24 * 60 * 60, checkperiod: 60 * 60, useClones: true});

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
    host:     "database.cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
    user:     "admin",
    password: "4dRV2eh9t68Akfj",
    database: "historical ",
    charset:  "utf8mb4",
    // multipleStatements: true,
    // connectTimeout: 15000,
    // acquireTimeout: 10000,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 5000,
    debug:    false
  }
};

// Initialising the instance
const connection = PoolManager(options);


// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


let metadata = null;
let queryMap = null;
/**********************
 * Example get method *
 **********************/

app.get("/query/:name", async (req, res) => {
  if (!queryMap) {
    queryMap = queries;
  }
  connection.query((queryMap[req.params.name])( req.query),
                   (results, error) => {
                     if (error) {
                       res.json({error: error.message, details: JSON.stringify(error)});
                     } else {
                       res.json(results);
                     }
                   });
});

app.post("/query/:name", async (req, res) => {
  if (!queryMap) {
    queryMap = queries;
  }
  console.log(queryMap[req.params.name]);
  const key = req.params.name + ":" + JSON.stringify(req.body);
  if (queryCache.has(key)) {
    console.log("Returned from cache " + key);
    res.json(queryCache.get(key));
    return;
  } else {
    console.log("Retrieving query for " + key);
    connection.query((queryMap[req.params.name])(req.body),
                     (results, error) => {
                       if (error) {
                         res.json({error: error.message, details: JSON.stringify(error)});
                       } else {
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

app.listen(3000, function() {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
