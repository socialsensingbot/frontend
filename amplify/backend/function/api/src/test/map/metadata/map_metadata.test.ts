import * as request from "supertest";
import {expect} from "chai";

import * as app from "../../../app"


const metadataResponse = {
    version: "1.0",
    maps:    [
        {
            version:             1,
            id:                  "uk-flood-live",
            title:               "UK Flood",
            location:            "uk",
            default_layer_group: "flood-only",
            start_lat:           53,
            start_lng:           -2,
            start_zoom:          6,
            default_region_type: "county",
            last_date:           null
        },
        {
            version:             1,
            id:                  "uk-flood-test",
            title:               "UK Flood (Integration Tests)",
            location:            "uk",
            default_layer_group: "flood-only",
            start_lat:           53,
            start_lng:           -2,
            start_zoom:          6,
            default_region_type: "county",
            last_date:           "2021-09-15T00:00:00.000Z"
        }
    ],
    start:   {lat: 53, lng: -2, zoom: 6}
};
describe("GET /v1/map/metadata", function () {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/v1/map/metadata")
            .set("Accept", "application/json");
        expect(JSON.stringify(response.body)).to.equal(JSON.stringify(metadataResponse));
    });
});
