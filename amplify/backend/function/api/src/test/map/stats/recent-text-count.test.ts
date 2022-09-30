import * as request from "supertest";
import {expect} from "chai";
import {diffStrings, MAX_DATE_MILLIS, MIN_DATE_MILLIS, sortedStringify} from "../../constants";
import * as app from "../../../app";

const expectedResult = {
        "buckinghamshire": 2,
        "essex":           2,
        "greater london":  2,
        "hertfordshire":   2,
        "kent":            2,
        "lancashire":      1,
        "north yorkshire": 1,
        "slough":          2,
        "surrey":          2,
        "thurrock":        2,
        "west yorkshire":  1
    }

;


const reqBody = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    warnings:   "exclude",
    regionType: "county"
};
const invalidHazard1 = {
    hazards: [1],
    sources: [
        "twitter"
    ],

    warnings:   "exclude",
    regionType: "county"
};
const invalidHazard2 = {
    hazards: [],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    regionType: "county"
};
const invalidSources1 = {
    hazards: [
        "flood"
    ],
    sources: 0,

    warnings: "exclude",

    regionType: "county"
};
const invalidSources2 = {
    hazards: [
        "flood"
    ],
    sources: [],

    warnings: "exclude",

    regionType: "county"
};
const invalidSources3 = {
    hazards: [
        "flood"
    ],
    sources: [0],

    warnings: "exclude",

    regionType: "county"
};
const invalidWarnings1 = {
    hazards:  [
        "flood"
    ],
    sources:  [
        "twitter"
    ],
    warnings: "excluded",

    regionType: "county"
};
const invalidWarnings2 = {
    hazards:  [
        "flood"
    ],
    sources:  [
        "twitter"
    ],
    warnings: ["exclude"],

    regionType: "county"
};
const invalidWarnings3 = {
    hazards:  [
        "flood"
    ],
    sources:  [
        "twitter"
    ],
    warnings: [],

    regionType: "county"
};
const invalidWarnings4 = {
    hazards:  [
        "flood"
    ],
    sources:  [
        "twitter"
    ],
    warnings: true,

    regionType: "county"
};
const invalidRegionType1 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    regionType: null
};
const invalidRegionType2 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    regionType: 1
};
const invalidRegionType3 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    regionType: []
};
const invalidRegionType4 = {
    hazards:   [
        "flood"
    ],
    sources:   [
        "twitter"
    ],
    regions:   [
        "hertfordshire"
    ],
    warnings:  "exclude",
    pageSize:  2,
    page:      0,
    startDate: MIN_DATE_MILLIS,
    endDate:   MAX_DATE_MILLIS
};
describe("POST /v1/map/:map/recent-text-count", () => {
    it("stats", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(reqBody);
        console.log(sortedStringify(response.body));
        diffStrings(sortedStringify(response.body), sortedStringify(expectedResult));
        expect(sortedStringify(response.body)).to.equal(sortedStringify(expectedResult));
    });
    it("invalid map", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test2/text")
            .set("Accept", "application/json")
            .send(reqBody);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("map");
    });
    it("invalid hazards 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidHazard1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid hazards 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidHazard2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid sources 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidSources1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidSources2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidSources3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid warnings 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidWarnings1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidWarnings2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidWarnings3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidWarnings4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });

    it("invalid region type 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidRegionType1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidRegionType2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidRegionType3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/recent-text-count")
            .set("Accept", "application/json")
            .send(invalidRegionType4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
});
