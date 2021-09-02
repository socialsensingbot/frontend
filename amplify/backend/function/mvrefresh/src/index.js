const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.substring("query-".length);
console.log("STAGE: " + stage);
const mysql = require("mysql");

const connection = mysql.createPool({
                                        connectionLimit: 1,
                                        host:            "database-" + stage + ".cxsscwdzsrae.eu-west-2.rds.amazonaws.com",
                                        user:            "admin",
                                        password:        "4dRV2eh9t68Akfj",
                                        database:        "socialsensing",
                                        charset:         "utf8mb4",
                                        // multipleStatements: true,
                                        // connectTimeout: 15000,
                                        // acquireTimeout: 10000,
                                        waitForConnections: true,
                                        queueLimit:         5000,
                                        debug:              false
                                    });


exports.handler = async (event) => {
    console.log(event);
    try {
        await connection.query({sql: `CALL refresh_mv_now(@rc);`, values: {}}, (error, results) => {
            if (error) {
                console.error(error);
            } else {
                console.log("Returned " + results.length + " rows");
            }
        });
    } catch (e) {
        console.error(e);
    }
};
