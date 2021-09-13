import {Pool} from "mysql";
import TwitterApi from "twitter-api-v2";

const aws = require("aws-sdk");
const mysql = require("mysql");
const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.split("-")[1];

console.log("STAGE: " + stage);
const dev = stage === "dev";

const awsServerlessExpress = require("aws-serverless-express");
const init = async () => {
    // See https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html on how to set up VPC
    const {Parameters} = await ((new aws.SSM())
        .getParameters({
                           Names:          ["DB_PASSWORD", "TWITTER_BEARER_TOKEN"].map(secretName => process.env[secretName]),
                           WithDecryption: true,
                       })
        .promise());


    console.log("Parameters:", Parameters);
    const dbPassword = Parameters.filter(i => i.Name.endsWith("DB_PASSWORD")).pop().Value;
    const twitterBearerToken = Parameters.filter(i => i.Name.endsWith("TWITTER_BEARER_TOKEN")).pop().Value;
    console.log("DB Password: " + dbPassword);
    // Initialising the MySQL connection
    const connection: Pool = mysql.createPool({
                                                  connectionLimit: 5,
                                                  host:            "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                                  user:            "admin",
                                                  password:        dbPassword,
                                                  database:        "socialsensing",
                                                  charset:         "utf8mb4",
                                                  // multipleStatements: true,
                                                  // connectTimeout: 15000,
                                                  // acquireTimeout: 10000,
                                                  waitForConnections: true,
                                                  queueLimit:         5000,
                                                  debug:              false
                                              });
    const twitter = new TwitterApi(twitterBearerToken);

    return awsServerlessExpress.createServer(require("./app")(connection, twitter));

};
const server = init();

export const handler = async (event, context) => {
    console.log(`EVENT DATA: ${JSON.stringify(event)}`);
    context.stage = stage;
    context.dev = dev;
    return awsServerlessExpress.proxy(await server, event, context, "PROMISE").promise;
};
