import * as request from "supertest";
import {expect} from "chai";
import {MAX_DATE_MILLIS, MIN_DATE_MILLIS, sortedStringify} from "../../constants";
import * as app from "../../../app";

const expectedResult = {
        "argyll and bute":          {"count": 1, "exceedance": 11.0125},
        "blackburn with darwen":    {"count": 1, "exceedance": 5.7411},
        "bristol, city of":         {"count": 1, "exceedance": 31.5762},
        "buckinghamshire":          {"count": 1, "exceedance": 23.8518},
        "cambridgeshire":           {"count": 18, "exceedance": 0.4175},
        "cheshire":                 {"count": 1, "exceedance": 31.9415},
        "cumbria":                  {"count": 1, "exceedance": 37.2651},
        "derby":                    {"count": 1, "exceedance": 11.6388},
        "derbyshire":               {"count": 1, "exceedance": 37.5261},
        "dumfries and galloway":    {"count": 2, "exceedance": 3.5491},
        "east riding of yorkshire": {"count": 1, "exceedance": 14.2484},
        "essex":                    {"count": 4, "exceedance": 8.4029},
        "glasgow city":             {"count": 3, "exceedance": 12.3173},
        "gloucestershire":          {"count": 1, "exceedance": 27.8184},
        "greater london":           {"count": 172, "exceedance": 0.7307},
        "greater manchester":       {"count": 2, "exceedance": 41.6493},
        "halton":                   {"count": 1, "exceedance": 3.0271},
        "hampshire":                {"count": 1, "exceedance": 37.8914},
        "herefordshire":            {"count": 1, "exceedance": 17.6409},
        "hertfordshire":            {"count": 2, "exceedance": 16.9624},
        "highland":                 {"count": 1, "exceedance": 22.0772},
        "kent":                     {"count": 2, "exceedance": 24.2693},
        "lancashire":               {"count": 1, "exceedance": 44.5198},
        "leicestershire":           {"count": 1, "exceedance": 39.1962},
        "lincolnshire":             {"count": 1, "exceedance": 29.6451},
        "louth":                    {"count": 1, "exceedance": 4.6973},
        "newport":                  {"count": 1, "exceedance": 13.2568},
        "norfolk":                  {"count": 2, "exceedance": 18.8935},
        "north lincolnshire":       {"count": 1, "exceedance": 6.524},
        "northamptonshire":         {"count": 2, "exceedance": 11.8476},
        "peterborough":             {"count": 1, "exceedance": 9.6033},
        "south yorkshire":          {"count": 2, "exceedance": 17.2756},
        "southend-on-sea":          {"count": 1, "exceedance": 2.6096},
        "staffordshire":            {"count": 1, "exceedance": 41.858},
        "surrey":                   {"count": 1, "exceedance": 48.3299},
        "thurrock":                 {"count": 2, "exceedance": 1.6701},
        "west midlands":            {"count": 2, "exceedance": 24.1127},
        "west sussex":              {"count": 1, "exceedance": 26.2526},
        "west yorkshire":           {"count": 4, "exceedance": 12.0564},
        "wiltshire":                {"count": 3, "exceedance": 4.2276},
        "worcestershire":           {"count": 1, "exceedance": 42.2234}
    }

;
const noEndateExpectedResult = {
    "dumfries and galloway":        {"count": 138, "exceedance": 10.1253},
    "greater london":               {"count": 2572, "exceedance": 16.9102},
    "west sussex":                  {"count": 200, "exceedance": 26.2526},
    "kent":                         {"count": 271, "exceedance": 47.5992},
    "hertfordshire":                {"count": 162, "exceedance": 38.7265},
    "cumbria":                      {"count": 650, "exceedance": 8.977},
    "essex":                        {"count": 296, "exceedance": 40.4489},
    "cheshire":                     {"count": 218, "exceedance": 31.9415},
    "west midlands":                {"count": 213, "exceedance": 46.6597},
    "south yorkshire":              {"count": 510, "exceedance": 17.2756},
    "highland":                     {"count": 145, "exceedance": 22.0772},
    "west yorkshire":               {"count": 679, "exceedance": 17.5887},
    "surrey":                       {"count": 361, "exceedance": 24.4259},
    "cambridgeshire":               {"count": 159, "exceedance": 34.3424},
    "greater manchester":           {"count": 965, "exceedance": 15.2923},
    "staffordshire":                {"count": 236, "exceedance": 41.858},
    "lancashire":                   {"count": 375, "exceedance": 20.2505},
    "glasgow city":                 {"count": 569, "exceedance": 12.3173},
    "norfolk":                      {"count": 206, "exceedance": 38.7265},
    "worcestershire":               {"count": 312, "exceedance": 19.9896},
    "hampshire":                    {"count": 171, "exceedance": 37.8914},
    "derbyshire":                   {"count": 383, "exceedance": 16.9624},
    "leicestershire":               {"count": 181, "exceedance": 39.1962},
    "bristol, city of":             {"count": 144, "exceedance": 31.5762},
    "dorset":                       {"count": 191, "exceedance": 30.8977},
    "north yorkshire":              {"count": 435, "exceedance": 25.5741},
    "city of edinburgh":            {"count": 164, "exceedance": 33.4551},
    "suffolk":                      {"count": 209, "exceedance": 41.0752},
    "merseyside":                   {"count": 243, "exceedance": 35.1253},
    "nottinghamshire":              {"count": 127, "exceedance": 30.7411},
    "dublin":                       {"count": 195, "exceedance": 39.9269},
    "somerset":                     {"count": 123, "exceedance": 31.1587},
    "tyne and wear":                {"count": 214, "exceedance": 30.6367},
    "shropshire":                   {"count": 328, "exceedance": 13.8309},
    "oxfordshire":                  {"count": 166, "exceedance": 37.9958},
    "cork":                         {"count": 252, "exceedance": 32.1503},
    "warwickshire":                 {"count": 110, "exceedance": 30.0626},
    "cornwall and isles of scilly": {"count": 193, "exceedance": 36.5866},
    "cardiff":                      {"count": 117, "exceedance": 23.9562},
    "powys":                        {"count": 142, "exceedance": 17.8497},
    "devon":                        {"count": 479, "exceedance": 28.1315},
    "wexford":                      {"count": 146, "exceedance": 5.5324},
    "northumberland":               {"count": 157, "exceedance": 26.6701}
}


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
        expect(JSON.stringify(response.body)).equals(JSON.stringify(noEndateExpectedResult));
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
