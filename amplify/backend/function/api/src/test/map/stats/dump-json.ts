import * as request from "supertest";
import * as app from "../../../app";


let start: number = new Date(2022, 1, 22).getTime();
const geoJsonRequest = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  start,
    endDate:    start + 24 * 60 * 60 * 1000,
    regionType: "fine",
    format:     "geojson"
};


describe("POST /v1/map/:map/stats", () => {
    it("stats as geojson", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-live/stats")
            .set("Accept", "application/json")
            .send(geoJsonRequest);
        console.log(JSON.stringify(response.body));
    });
});
