import * as request from "supertest";
import {expect} from "chai";

import * as app from "../../../app";


const metadataResponse =
    {
        id:                 "uk-flood-test",
        title:              "UK Flood (Integration Tests)",
        location:           "uk",
        regionTypes:        [{id: "county", title: "Local Authority"}, {id: "fine", title: "Fine Grid"},
                             {id: "coarse", title: "Coarse Grid"}],
        regionAggregations: ["uk-countries"],
        defaultRegionType:  "county",
        start:              {lat: 53, lng: -2, zoom: 6}
    };


describe("GET /v1/map/:map/metadata", () => {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/v1/map/uk-flood-test/now")
            .set("Accept", "application/json");
        console.log(response.body);
        expect(response.body).to.equal(1631664000000);
    });
});
