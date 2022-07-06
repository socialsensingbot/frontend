import * as request from "supertest";
import {expect} from "chai";

import * as app from "../../../app";
import {sortedStringify} from "../../constants";
import {allRegions} from "./data/regions";

describe("GET /v1/map/:map/regions", () => {
    it("responds with json", async () => {
        const response = await request(app)
            .get("/v1/map/uk-flood-test/regions")
            .set("Accept", "application/json");
        console.log(sortedStringify(response.body));
        expect(sortedStringify(response.body)).to.equal(sortedStringify(allRegions));
    });
});
