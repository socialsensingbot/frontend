import {Pool} from "mysql";
import * as NodeCache from "node-cache";

const aws = require("aws-sdk");

const mysql = require("mysql");

export class SSDatabase {

    private queryCache = new NodeCache({stdTTL: 60 * 60, checkperiod: 60 * 60, useClones: true});
    public connection: Pool;
    private disabled: boolean;
    private dbPassword: string;
    private readyPromise: Promise<void>;

    constructor(private stage: string) {
        this.readyPromise = ((new aws.SSM())
            .getParameters({
                               Names:          ["DB_PASSWORD", "TWITTER_BEARER_TOKEN"].map(secretName => process.env[secretName]),
                               WithDecryption: true,
                           })
            .promise().then(result => {
                console.log("Parameters:", result.Parameters);
                this.dbPassword = result.Parameters.filter(i => i.Name.endsWith("DB_PASSWORD")).pop().Value;
                console.log("DB Password: " + this.dbPassword);
                // Initialising the MySQL connection

                this.connection = mysql.createPool({
                                                       connectionLimit: 5,
                                                       host:            "database-" + this.stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                                       user:            "admin",
                                                       password:        this.dbPassword,
                                                       database:        "socialsensing",
                                                       charset:         "utf8mb4",
                                                       // multipleStatements: true,
                                                       // connectTimeout: 15000,
                                                       // acquireTimeout: 10000,
                                                       waitForConnections: true,
                                                       queueLimit:         5000,
                                                       debug:              false
                                                   });
            }));


    }

    async cache(res, key: string, value: () => Promise<any>, options: { duration: number } = {duration: 60}) {
        await this.readyPromise;
        try {
            if (this.disabled) {
                res.setHeader("X-SocialSensing-API-Disabled");
                res.status(500);
                return;
            }
            res.setHeader("X-SocialSensing-CachedQuery-Key", key);
            if (key != null && this.queryCache.has(key)) {
                console.log("Returned from cache " + key);
                res.setHeader("X-SocialSensing-CachedQuery-Key", key);
                res.setHeader("X-SocialSensing-CachedQuery-Expires-At", this.queryCache.getTtl(key));
                res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Minutes", (this.queryCache.getTtl(key) - Date.now()) / (60 * 1000));
                res.setHeader("X-SocialSensing-CachedQuery-Expires-In-Hours",
                              (this.queryCache.getTtl(key) - Date.now()) / (60 * 60 * 1000));
                res.json(this.queryCache.get(key));
                return;
            } else {
                console.log("Retrieving query for " + key);

                res.setHeader("X-SocialSensing-CachedQuery", "false");
                return value().then(result => {
                    if (key !== null) {
                        setTimeout(() => {
                            this.queryCache.set(key, result, options.duration);
                        }, 10);
                    }
                    res.json(result);
                }).catch(e => this.handleError(res, e));
            }
        } catch (e) {
            this.handleError(res, e);
        }
    };


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
            this.connection.getConnection((err, poolConnection) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (tx) {
                    poolConnection.beginTransaction();
                }
                poolConnection.query(options, (error, results) => {
                    if (error) {
                        console.error(error);
                        reject(error);
                    } else {
                        let s: string = JSON.stringify(results);
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

        });
    }

}
