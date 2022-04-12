import * as request from "supertest";
import {expect} from "chai";
import {diffStrings, MAX_DATE_MILLIS, MIN_DATE_MILLIS, sortedStringify} from "../../constants";
import * as app from "../../../app";

const expectedResult = {
        "argyll and bute":          {"count": 1, "exceedance": 11},
        "blackburn with darwen":    {"count": 1, "exceedance": 6},
        "bristol, city of":         {"count": 1, "exceedance": 32},
        "buckinghamshire":          {"count": 1, "exceedance": 24},
        "cambridgeshire":           {"count": 18, "exceedance": 0},
        "cheshire":                 {"count": 1, "exceedance": 32},
        "cumbria":                  {"count": 1, "exceedance": 37},
        "derby":                    {"count": 1, "exceedance": 12},
        "derbyshire":               {"count": 1, "exceedance": 38},
        "dumfries and galloway":    {"count": 2, "exceedance": 4},
        "east riding of yorkshire": {"count": 1, "exceedance": 14},
        "essex":                    {"count": 4, "exceedance": 9},
        "glasgow city":             {"count": 3, "exceedance": 12},
        "gloucestershire":          {"count": 1, "exceedance": 28},
        "greater london":           {"count": 172, "exceedance": 1},
        "greater manchester":       {"count": 2, "exceedance": 42},
        "halton":                   {"count": 1, "exceedance": 3},
        "hampshire":                {"count": 1, "exceedance": 38},
        "herefordshire":            {"count": 1, "exceedance": 18},
        "hertfordshire":            {"count": 2, "exceedance": 17},
        "highland":                 {"count": 1, "exceedance": 22},
        "kent":                     {"count": 2, "exceedance": 24},
        "lancashire":               {"count": 1, "exceedance": 45},
        "leicestershire":           {"count": 1, "exceedance": 39},
        "lincolnshire":             {"count": 1, "exceedance": 30},
        "louth":                    {"count": 1, "exceedance": 5},
        "newport":                  {"count": 1, "exceedance": 13},
        "norfolk":                  {"count": 2, "exceedance": 19},
        "north lincolnshire":       {"count": 1, "exceedance": 7},
        "northamptonshire":         {"count": 2, "exceedance": 12},
        "peterborough":             {"count": 1, "exceedance": 10},
        "south yorkshire":          {"count": 2, "exceedance": 17},
        "southend-on-sea":          {"count": 1, "exceedance": 3},
        "staffordshire":            {"count": 1, "exceedance": 42},
        "surrey":                   {"count": 1, "exceedance": 49},
        "thurrock":                 {"count": 2, "exceedance": 2},
        "west midlands":            {"count": 2, "exceedance": 24},
        "west sussex":              {"count": 1, "exceedance": 26},
        "west yorkshire":           {"count": 4, "exceedance": 12},
        "wiltshire":                {"count": 3, "exceedance": 4},
        "worcestershire":           {"count": 1, "exceedance": 42}
    }


;
const noEndateExpectedResult = {
    "argyll and bute":          {"count": 1, "exceedance": 11},
    "blackburn with darwen":    {"count": 1, "exceedance": 6},
    "bristol, city of":         {"count": 1, "exceedance": 32},
    "buckinghamshire":          {"count": 1, "exceedance": 24},
    "cambridgeshire":           {"count": 18, "exceedance": 0},
    "cheshire":                 {"count": 1, "exceedance": 32},
    "cumbria":                  {"count": 1, "exceedance": 37},
    "derby":                    {"count": 1, "exceedance": 12},
    "derbyshire":               {"count": 1, "exceedance": 38},
    "dumfries and galloway":    {"count": 2, "exceedance": 4},
    "east riding of yorkshire": {"count": 1, "exceedance": 14},
    "essex":                    {"count": 4, "exceedance": 9},
    "glasgow city":             {"count": 3, "exceedance": 12},
    "gloucestershire":          {"count": 1, "exceedance": 28},
    "greater london":           {"count": 172, "exceedance": 1},
    "greater manchester":       {"count": 2, "exceedance": 42},
    "halton":                   {"count": 1, "exceedance": 3},
    "hampshire":                {"count": 1, "exceedance": 38},
    "herefordshire":            {"count": 1, "exceedance": 18},
    "hertfordshire":            {"count": 2, "exceedance": 17},
    "highland":                 {"count": 1, "exceedance": 22},
    "kent":                     {"count": 2, "exceedance": 24},
    "lancashire":               {"count": 1, "exceedance": 45},
    "leicestershire":           {"count": 1, "exceedance": 39},
    "lincolnshire":             {"count": 1, "exceedance": 30},
    "louth":                    {"count": 1, "exceedance": 5},
    "newport":                  {"count": 1, "exceedance": 13},
    "norfolk":                  {"count": 2, "exceedance": 19},
    "north lincolnshire":       {"count": 1, "exceedance": 7},
    "northamptonshire":         {"count": 2, "exceedance": 12},
    "peterborough":             {"count": 1, "exceedance": 10},
    "south yorkshire":          {"count": 2, "exceedance": 17},
    "southend-on-sea":          {"count": 1, "exceedance": 3},
    "staffordshire":            {"count": 1, "exceedance": 42},
    "surrey":                   {"count": 1, "exceedance": 49},
    "thurrock":                 {"count": 2, "exceedance": 2},
    "west midlands":            {"count": 2, "exceedance": 24},
    "west sussex":              {"count": 1, "exceedance": 26},
    "west yorkshire":           {"count": 4, "exceedance": 12},
    "wiltshire":                {"count": 3, "exceedance": 4},
    "worcestershire":           {"count": 1, "exceedance": 42}
};


const reqBody = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidHazard1 = {
    hazards: [1],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidHazard2 = {
    hazards: [],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidSources1 = {
    hazards: [
        "flood"
    ],
    sources: 0,

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidSources2 = {
    hazards: [
        "flood"
    ],
    sources: [],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidSources3 = {
    hazards: [
        "flood"
    ],
    sources: [0],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};

const invalidStartDate1 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  -1,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidStartDate2 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  "Wed Apr  6 18:11:20 BST 2022",
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidStartDate3 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidStartDate4 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  4796668800000,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};


const invalidEndDate1 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    -1,
    regionType: "county"
};
const invalidEndDate2 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    "Wed Apr  6 18:11:20 BST 2022",
    regionType: "county"
};
const invalidEndDate3 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
    endDate:    4796668800000,
    regionType: "county"
};
const invalidEndDate4 = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MAX_DATE_MILLIS,
    endDate:    MIN_DATE_MILLIS,
    regionType: "county"
};
const noEndDate = {
    hazards: [
        "flood"
    ],
    sources: [
        "twitter"
    ],

    warnings: "exclude",

    startDate:  MIN_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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

    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
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
describe("POST /v1/map/:map/stats", () => {
    it("stats", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
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
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidHazard1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid hazards 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidHazard2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid sources 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidSources1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidSources2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidSources3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid warnings 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidWarnings1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidWarnings2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidWarnings3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidWarnings4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });

    it("invalid start date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidStartDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidStartDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidStartDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidStartDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid end date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidEndDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidEndDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidEndDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidEndDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("no end date", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(noEndDate);
        console.log(response.body);
        expect(response.status).equals(200);
        diffStrings(sortedStringify(response.body), sortedStringify(noEndateExpectedResult));
        expect(sortedStringify(response.body)).equals(sortedStringify(noEndateExpectedResult));
    });
    it("invalid region type 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidRegionType1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidRegionType2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidRegionType3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(invalidRegionType4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
});
