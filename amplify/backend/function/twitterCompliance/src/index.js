/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["TWITTER_BEARER_TOKEN","DB_PASSWORD"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
const aws = require('aws-sdk');

const mysql = require("mysql");
const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.split("-")[1];
const TwitterApi = require("twitter-api-v2").TwitterApi;

console.log("STAGE: " + stage);
const dev = stage === "dev";


exports.handler = async (event) => {

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
    console.log("Twitter Bearer Token: " + twitterBearerToken);
    // Initialising the MySQL connection
    const connection = mysql.createConnection({
                                                  host:     "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                                  user:     "admin",
                                                  password: dbPassword,
                                                  database: "socialsensing",
                                                  charset:  "utf8mb4",
                                                  // multipleStatements: true,
                                                  // connectTimeout: 15000,
                                                  // acquireTimeout: 10000,
                                                  waitForConnections: true,
                                                  queueLimit:         5000,
                                                  debug:              false
                                              });

    const sql = async (options) => {
        return new Promise((resolve, reject) => {
            connection.query(options, (error, results) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    let s = JSON.stringify(results);
                    console.log(options.sql, options.values, s.substring(0, s.length > 1000 ? 1000 : s.length));
                    console.log("Returned " + results.length + " rows");
                    resolve(results);
                }
            });
        });
    };


    const twitter = new TwitterApi(twitterBearerToken);
    const ids = (await sql({
// language=MySQL
                               sql: "select distinct source_id as id from live_text where source = 'twitter' and source_date > now() -  interval 7 day and not deleted"
                           })).map(i => i.id);

    console.log("Obtained id list size=" + ids.length);

    const createdJob = await twitter.v2.sendComplianceJob({type: "tweets", ids});
    console.log("Created compliance job" + JSON.stringify(createdJob));
    const jobResult = await twitter.v2.complianceJobResult(createdJob.data);
    console.log("Received compliance result" + JSON.stringify(jobResult));
    for (const tweetCompliance of jobResult) {
        // Job result is parsed into an array
        console.log(`#${tweetCompliance.id}: action ${tweetCompliance.action} because ${tweetCompliance.reason}`);
        if (tweetCompliance.action === "delete") {
            await sql({
                          sql:    "update live_text set deleted = true AND compliance_reason = ? where source = 'twitter' and source_id = ?",
                          values: [tweetCompliance.reason, tweetCompliance.id]
                      });
        }
    }
    connection.commit();


};
