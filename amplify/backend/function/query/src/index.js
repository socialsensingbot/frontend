"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
var awsServerlessExpress = require("aws-serverless-express");
var server = awsServerlessExpress.createServer(require("./app"));
var handler = function (event, context) {
    console.log("EVENT DATA: " + JSON.stringify(event));
    return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};
exports.handler = handler;
