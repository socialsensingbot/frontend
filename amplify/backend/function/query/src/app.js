/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "*")
    next()
    next()
});


app.post('/query/:queryName', function (req, res) {
    // Add your code here
    res.json([{date: "30 May 2021", count: 10},
                 {date: "31 May 2021", count: 4},
                 {date: "01 June 2021", count: 8},
                 {date: "02 June 2021", count: 6},
                 {date: "03 June 2021", count: 4},
                 {date: "04 June 2021", count: 10},
                 {date: "05 June 2021", count: 30},
                 {date: "06 June 2021", count: 8},
                 {date: "07 June 2021", count: 4}]);
});
app.post('/refdata/regions', function (req, res) {
    // Add your code here
    res.json( [{text: "England", value: "england"}, {text: "Wales", value: "wales"}]);
});

app.post('/query/:queryName/*', function (req, res) {
    // Add your code here
    res.json({success: 'post call succeed!', url: req.url, body: req.body})
});


app.listen(3000, function () {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
