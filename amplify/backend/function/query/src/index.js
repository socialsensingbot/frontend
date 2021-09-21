"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.handler = void 0;
var twitter_api_v2_1 = require("twitter-api-v2");
var aws = require("aws-sdk");
var mysql = require("mysql");
var stage = process.env.AWS_LAMBDA_FUNCTION_NAME.split("-")[1];
console.log("STAGE: " + stage);
var dev = stage === "dev";
var awsServerlessExpress = require("aws-serverless-express");
var init = function () { return __awaiter(void 0, void 0, void 0, function () {
    var Parameters, dbPassword, twitterBearerToken, connection, twitter;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ((new aws.SSM())
                    .getParameters({
                    Names: ["DB_PASSWORD", "TWITTER_BEARER_TOKEN"].map(function (secretName) { return process.env[secretName]; }),
                    WithDecryption: true
                })
                    .promise())];
            case 1:
                Parameters = (_a.sent()).Parameters;
                console.log("Parameters:", Parameters);
                dbPassword = Parameters.filter(function (i) { return i.Name.endsWith("DB_PASSWORD"); }).pop().Value;
                twitterBearerToken = Parameters.filter(function (i) { return i.Name.endsWith("TWITTER_BEARER_TOKEN"); }).pop().Value;
                console.log("DB Password: " + dbPassword);
                connection = mysql.createPool({
                    connectionLimit: 5,
                    host: "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                    user: "admin",
                    password: dbPassword,
                    database: "socialsensing",
                    charset: "utf8mb4",
                    // multipleStatements: true,
                    // connectTimeout: 15000,
                    // acquireTimeout: 10000,
                    waitForConnections: true,
                    queueLimit: 5000,
                    debug: false
                });
                twitter = new twitter_api_v2_1["default"](twitterBearerToken);
                return [2 /*return*/, awsServerlessExpress.createServer(require("./app")(connection, twitter))];
        }
    });
}); };
var server = init();
var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("EVENT DATA: " + JSON.stringify(event));
                context.stage = stage;
                context.dev = dev;
                _b = (_a = awsServerlessExpress).proxy;
                return [4 /*yield*/, server];
            case 1: return [2 /*return*/, _b.apply(_a, [_c.sent(), event, context, "PROMISE"]).promise];
        }
    });
}); };
exports.handler = handler;
