const awsServerlessExpress = require("aws-serverless-express");
const server = awsServerlessExpress.createServer(require("./app"));

export const handler = (event, context) => {
  console.log(`EVENT DATA: ${JSON.stringify(event)}`);
  return awsServerlessExpress.proxy(server, event, context, "PROMISE").promise;
};
