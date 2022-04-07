import * as request from "supertest";
import {expect} from "chai";

import * as app from "../../../app";
import {londonGeoJson} from "./data/greater-london-geojson";


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


describe("GET /v1/map/:map/region-type/:regionType/region/:region/geography", () => {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/v1/map/uk-flood-test/region-type/county/region/greater london/geography")
            .set("Accept", "application/json");
        console.log(JSON.stringify(response.body));
        expect(JSON.stringify(response.body)).to.equal(JSON.stringify(londonGeoJson));
    });
});
