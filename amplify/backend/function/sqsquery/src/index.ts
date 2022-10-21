import {functionLookup, MapFunctionName, MapFunctionRequest, MapFunctionResponse} from "socialsensing-api/map-queries";

//bump 36
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context) => {
    console.log(event);
    const requests = new Map<string, MapFunctionRequest>()
    const promises: Promise<any>[] = [];
    event.Records.forEach(record => {
        console.log(record);
        const req: MapFunctionRequest = JSON.parse(record.body);
        //deduplication
        requests.set(req.key, req);
    });
    requests.forEach(req => {
        console.log("Reconstituted request", req);
        const res: MapFunctionResponse = {
            json:      (result) => {
                console.log("Result ignored for " + req.key);
            }, status: (code) => {
                console.log("Status code ignored for " + req.key, code);
            }
        };
        promises.push(functionLookup(req.name as MapFunctionName)(req, res));

    });
    console.log(await Promise.allSettled(promises));
    return {};
};
