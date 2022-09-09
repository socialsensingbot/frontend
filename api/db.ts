import {Pool} from "mysql";
import * as NodeCache from "node-cache";
// Create the DynamoDB service client module using ES6 syntax.
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";

const zlib = require("zlib");

const md5 = require("md5");
// Set the AWS Region.
export const AWS_REGION = "eu-west-2"; // For example, "us-east-1".
// Create an Amazon DynamoDB service client object.
export const ddbClient = new DynamoDBClient({region: AWS_REGION});


const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: true, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: true, // false, by default.
};

const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
};

const translateConfig = {marshallOptions, unmarshallOptions};

// Create the DynamoDB document client.
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);


// const writeToPersistentCache = async (stage, key, fn, parameters, data, expireInSeconds) => {
//     // Set the parameters.
//     const params = {
//         TableName: "api-results-and-cache",
//         Item:      {
//             key:          key,
//             functionName: fn,
//             params:       parameters,
//             ttl:          Math.round(Date.now() / 1000 + expireInSeconds),
//             data:         JSON.stringify(data),
//             stage:        stage
//         },
//     };
//     try {
//         await ddbDocClient.send(new PutCommand(params));
//         console.log("Success - item added or updated", data);
//         return key;
//     } catch (err) {
//         console.log("Error", err.stack);
//     }
// };
//
// // Set the parameters.
// export const readFromPersistentCache = async (key: string) => {
//     try {
//         const params = {
//             TableName: "api-results-and-cache",
//             Key:       {
//                 key: key,
//             },
//         };
//
//         const data: any = await ddbDocClient.send(new GetCommand(params));
//         console.log("Success :", data.Item);
//         if (data.Item) {
//             return JSON.parse(data.Item.data);
//         } else {
//             return undefined;
//         }
//     } catch (err) {
//         console.log("Error", err);
//         return null;
//     }
// };

// Load the AWS SDK for Node.js
const aws = require("aws-sdk");
// Set the region
aws.config.update({region: AWS_REGION});
// Create S3 service object
const s3 = new aws.S3({apiVersion: "2006-03-01"});

const writeToPersistentCache = async (stage, key, fn, parameters, data, expireInSeconds) => {

    return new Promise<any>((resolve, reject) => {
        const buf = zlib.gzipSync(JSON.stringify({
                                                     key,
                                                     functionName: fn,
                                                     params:       parameters,
                                                     ttl:          Math.round(Date.now() / 1000 + expireInSeconds),
                                                     data,
                                                     stage
                                                 }
        ));

        let fullKey: string = "public/api/" + key + ".gz.json";
        const s3params = {
            Bucket:          process.env.STORAGE_JSONSTORAGE_BUCKETNAME,
            Key:             fullKey,
            Body:            buf,
            ContentEncoding: "gzip",
            ContentType:     "application/json",
            // ACL:             'public-read'
        };

        s3.upload(s3params, (err, data) => {
            if (err) {
                console.log(err);
                console.log("Error uploading data: ", data);
                reject(err);
                return;
            } else {
                console.log("succesfully uploaded " + fullKey);
                resolve(key);
                return;
            }
        });
    });

};

// Set the parameters.
export const readFromPersistentCache = async (key: string) => {
    return new Promise<any>((resolve, reject) => {
        const params = {
            Bucket: process.env.STORAGE_JSONSTORAGE_BUCKETNAME,
            Key:    "public/api/" + key + ".gz.json",
        };
        s3.getObject(params, (err, data) => {
            if (err && err.code === 'NoSuchKey') {
                resolve(null);
                return;
            } else if (err) {
                console.error(err);
                reject(err);
                return;
            }
            if (data == null) {
                console.log("Null result from S3");
                resolve(null);
                return;
            }
            const body: any = JSON.parse(zlib.unzipSync(data.Body).toString());
            if (body.ttl < Date.now() / 1000) {
                console.log("S3 object expired");
                resolve(null);
                return;
            } else {
                resolve(body.data);
                return;
            }
        });
    });
};


const mysql = require("mysql");

export class SSDatabase {

    private queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: true});
    public connection: Pool;
    private disabled: boolean;
    private dbPassword: string;
    private readyPromise: Promise<void>;

    constructor(private stage: string, readonly = true) {
        if (stage === "_test") {
            console.log("DB Running in test mode.");
            this.readyPromise = new Promise((resolve, reject) => {
                try {
                    const dbEnvironment: string | undefined = process.env.DB_ENV || "dev";
                    console.log("Using db environment: " + dbEnvironment);
                    this.connection = mysql.createPool({
                                                           connectionLimit: 5,
                                                           host:            `database-${dbEnvironment}.cxsscwdzsrae.eu-west-2.rds.amazonaws.com`,
                                                           user:            "admin",
                                                           password:        process.env.SS_TEST_DB_PASSWORD,
                                                           database:        "socialsensing",
                                                           charset:         "utf8mb4",
                                                           // multipleStatements: true,
                                                           // connectTimeout: 15000,
                                                           // acquireTimeout: 10000,
                                                           waitForConnections: true,
                                                           queueLimit:         50,
                                                           debug:              false
                                                       });
                    resolve();
                } catch (e) {
                    reject(e);
                }

            });

        } else {
            console.log("DB Running in Lambda mode.");

            this.readyPromise = ((new aws.SSM())
                .getParameters({
                                   Names:          ["DB_PASSWORD"].map(secretName => process.env[secretName]),
                                   WithDecryption: true,
                               })
                .promise().then(result => {
                    console.log("Parameters:", result.Parameters);
                    this.dbPassword = result.Parameters.filter(i => i.Name.endsWith("DB_PASSWORD")).pop().Value;
                    console.log("DB Password: " + this.dbPassword);
                    // Initialising the MySQL connection

                    const hostname: string = "database-" + this.stage;
                    this.connection = mysql.createPool({
                                                           connectionLimit: 5,
                                                           host:            hostname + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                                           user:            "admin",
                                                           password:        this.dbPassword,
                                                           database:        "socialsensing",
                                                           charset:         "utf8mb4",
                                                           // multipleStatements: true,
                                                           // connectTimeout: 15000,
                                                           // acquireTimeout: 10000,
                                                           waitForConnections: true,
                                                           queueLimit:         50,
                                                           debug:              false
                                                       });
                }));
        }

    }

    end() {
        this.connection.end();
    }

    async cache(res, longRunning: boolean, functionName, parameters, key: string, value: () => Promise<any>,
                options: { duration: number; memoryCache: boolean, persistentCache?: boolean } = {
                    duration:        60,
                    memoryCache:     true,
                    persistentCache: true
                }) {
        if (longRunning) {
            return await this.persistentCache(res, functionName, key, parameters, value, options);
        } else {
            await this.readyPromise;
            try {
                if (this.disabled) {
                    res.setHeader("X-SocialSensing-API-Disabled");
                    res.status(500);
                    return;
                }
                res.setHeader("X-SocialSensing-CachedQuery-Key", key);
                if (options.memoryCache && this.queryCache.has(key)) {
                    console.log("Returned from cache " + key);
                    res.setHeader("X-SocialSensing-CachedQuery-Key", key);
                    res.setHeader("X-SocialSensing-CachedQuery-Expires-At", this.queryCache.getTtl(key));
                    res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Minutes",
                                  (this.queryCache.getTtl(key) - Date.now()) / (60 * 1000));
                    res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Hours",
                                  (this.queryCache.getTtl(key) - Date.now()) / (60 * 60 * 1000));
                    res.json(this.queryCache.get(key));
                    return;
                } else {
                    console.log("Retrieving query for " + key);

                    res.setHeader("X-SocialSensing-CachedQuery", "false");
                    return value().then(result => {
                        if (key !== null && result !== null) {
                            setTimeout(() => {
                                this.queryCache.set(key, result, options.duration);
                                writeToPersistentCache(this.stage, key, functionName, parameters, result, options.duration);
                            }, 10);
                        }
                        res.json(result);
                    }).catch(e => this.handleError(res, e));
                }
            } catch (e) {
                this.handleError(res, e);
            }
        }
    }

    async persistentCache(res, functionName: string, key: string, parameters: any, value: () => Promise<any>,
                          options: { duration: number } = {duration: 60}) {
        await this.readyPromise;
        try {
            if (this.disabled) {
                res.setHeader("X-SocialSensing-API-Disabled");
                res.status(500);
                return;
            }

            const cachedValue = await readFromPersistentCache(key);
            if (cachedValue) {
                console.log("Value already in cache for key " + key);
                res.json(cachedValue);
                return;

            } else {
                const result = await value();
                console.log("Writing to cache for key " + key);
                await writeToPersistentCache(this.stage, key, functionName, parameters, result, options.duration);
            }


        } catch (e) {
            this.handleError(res, e);
        }
    }

    async fromCache(key: string) {
        return await readFromPersistentCache(key);
    }


    public handleError<ResBody>(res, e): void {
        console.error(e);
        try {
            res.status(500).json(
                {
                    error:         JSON.stringify(e),
                    errorMessage:  e.message,
                    errorAsString: e.toString(),
                    errorStack:    this.stage === "dev" ? e.stack : "n/a"
                });
        } catch (e) {
            res.status(500).json(
                {
                    error:         e.message,
                    errorMessage:  e.message,
                    errorAsString: e.toString(),
                    errorStack:    this.stage === "dev" ? e.stack : "n/a"
                });

        }
    }


    public async sql(options: { sql: string; values?: any; }, tx = false): Promise<any[]> {
        await this.readyPromise;
        return new Promise((resolve, reject) => {
            try {
                this.connection.getConnection((err, poolConnection) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (tx) {
                        poolConnection.beginTransaction();
                    }
                    console.log("Ready to execute query", options.sql);
                    poolConnection.query(options, (error, results) => {
                        if (error) {
                            console.error(error);
                            reject(error);
                        } else {
                            const s: string = JSON.stringify(results);
                            console.log(options.sql, options.values, s.substring(0, s.length > 1000 ? 1000 : s.length));
                            console.log("Returned " + results.length + " rows");
                            resolve(results);
                            if (tx) {
                                poolConnection.commit();
                            }
                        }
                        poolConnection.release();
                    });
                });
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    }

}
