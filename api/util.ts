const aws = require("aws-sdk");

export const dateFromMillis = (time: number) => {
    const dateTime = new Date(time);
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
};
export const stage = process.env.AWS_LAMBDA_FUNCTION_NAME.substring("query-".length);
console.log("STAGE: " + stage);
const dev = stage === "dev";
// Load modules

export const roundToHour = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundToMinute = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};

export const roundTo15Minute = (timestamp: number): any => {
    const date: Date = new Date(timestamp);
    date.setUTCMinutes(Math.floor(date.getUTCMinutes() / 15) * 15);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date.getTime();
};


const {Parameters} = await ((new aws.SSM())
    .getParameters({
                       Names:          ["DB_PASSWORD", "TWITTER_BEARER_TOKEN"].map(secretName => process.env[secretName]),
                       WithDecryption: true,
                   })
    .promise());


console.log("Parameters:", Parameters);
export const dbPassword = Parameters.filter(i => i.Name.endsWith("DB_PASSWORD")).pop().Value;
console.log("DB Password: " + dbPassword);
// Initialising the MySQL connection


export const handleError = (res, e) => {
    console.error(e);
    try {
        res.status(500).json(
            {error: JSON.stringify(e), errorMessage: e.message, errorAsString: e.toString(), errorStack: dev ? e.stack : "n/a"});
    } catch (e) {
        res.status(500).json(
            {error: e.message, errorMessage: e.message, errorAsString: e.toString(), errorStack: dev ? e.stack : "n/a"});

    }
}
