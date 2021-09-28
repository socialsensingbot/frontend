/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["DB_PASSWORD"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.split("-")[1];
console.log("STAGE: " + stage);
const mysql = require("mysql");
const aws = require("aws-sdk");


exports.handler = async (event) => {
    console.log(event);
    const {Parameters} = await ((new aws.SSM())
        .getParameters({
                           Names:          ["DB_PASSWORD"].map(secretName => process.env[secretName]),
                           WithDecryption: true,
                       })
        .promise());


    console.log("Parameters:", Parameters);
    const dbPassword = Parameters.filter(i => i.Name.endsWith("DB_PASSWORD")).pop().Value;
    const connection = mysql.createPool({
                                            connectionLimit: 1,
                                            host:            "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                            user:            "admin",
                                            password:        dbPassword,
                                            database:        "socialsensing",
                                            charset:         "utf8mb4",
                                            // multipleStatements: true,
                                            // connectTimeout: 15000,
                                            // acquireTimeout: 10000,
                                            waitForConnections: true,
                                            queueLimit: 5
                                        });
    return new Promise((resolve, reject) => {
        connection.query({sql: `CALL refresh_mv_now(@rc);`, values: {}}, (error, results) => {
            if (error) {
                console.error(error);
                reject(error);
            } else {
                console.log("Returned " + results.length + " rows");
                resolve(results);
            }
        });
    });
};
