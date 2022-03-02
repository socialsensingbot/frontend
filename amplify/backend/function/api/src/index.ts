
const awsServerlessExpress = require("aws-serverless-express");
const server = awsServerlessExpress.createServer(require("./app"));

export const handler = async (event, context) => {
    console.log(`EVENT DATA: ${JSON.stringify(event)}`);
    return awsServerlessExpress.proxy(await server, event, context, "PROMISE").promise;
};
