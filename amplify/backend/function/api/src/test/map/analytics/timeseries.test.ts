import * as request from "supertest";
import {expect} from "chai";
import {MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../constants";
import * as app from "../../../app";


const reqBody = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidHazard1 = {
    hazards:    [1],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidHazard2 = {
    hazards:    [],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidSources1 = {
    hazards:    [
        "flood"
    ],
    sources:    0,
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidSources2 = {
    hazards:    [
        "flood"
    ],
    sources:    [],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidSources3 = {
    hazards:    [
        "flood"
    ],
    sources:    [0],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const regionCountry = {
    hazards:   [
        "flood"
    ],
    sources:   [
        "twitter"
    ],
    regions:   [
        "england"
    ],
    warnings:  "exclude",
    startDate: MIN_DATE_MILLIS,
    endDate:   MAX_DATE_MILLIS,

};
const regionArea = {
    hazards:   [
        "flood"
    ],
    sources:   [
        "twitter"
    ],
    regions:   [
        "south east england"
    ],
    warnings:  "exclude",
    startDate: MIN_DATE_MILLIS,
    endDate:   MAX_DATE_MILLIS,

};
const invalidRegions1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        0
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidRegions2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    0,
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidRegions3 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidWarnings1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    ["hertfordshire"],
    warnings:   "excluded",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidWarnings2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    ["hertfordshire"],
    warnings:   ["exclude"],
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidWarnings3 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    ["hertfordshire"],
    warnings:   [],
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};
const invalidWarnings4 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    ["hertfordshire"],
    warnings:   true,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

};

const invalidStartDate1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  -1,
    endDate:    MAX_DATE_MILLIS,

};
const invalidStartDate2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  "Wed Apr  6 18:11:20 BST 2022",
    endDate:    MAX_DATE_MILLIS,

};
const invalidStartDate3 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    endDate:    MAX_DATE_MILLIS,

};
const invalidStartDate4 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  4796668800000,
    endDate:    MAX_DATE_MILLIS,

};


const invalidEndDate1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    -1,

};
const invalidEndDate2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    "Wed Apr  6 18:11:20 BST 2022",

};
const invalidEndDate3 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    4796668800000,

};
const invalidEndDate4 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MAX_DATE_MILLIS,
    endDate:    MIN_DATE_MILLIS,

};
const noEndDate = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "greater london"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,

};
const invalidRegionType1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: null
};
const invalidRegionType2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: 1
};
const invalidRegionType3 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "hertfordshire"
    ],
    warnings:   "exclude",
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
    startDate: MIN_DATE_MILLIS,
    endDate:   MAX_DATE_MILLIS
};
const textSearch = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "greater london"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

    textSearch: "wet AND windy"
};
const invalidTextSearch1 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "greater london"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

    textSearch: ""
};
const invalidTextSearch2 = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "greater london"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

    textSearch: 0
};
const byHour = {
    hazards:    [
        "flood"
    ],
    sources:    [
        "twitter"
    ],
    regions:    [
        "greater london"
    ],
    warnings:   "exclude",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,

    timePeriod: "hour"
};
describe("POST /v1/map/:map/analytics/time", () => {
    it("single region", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(reqBody);
        console.log(JSON.stringify(response.body));
        expect(response.body.length).equal(2);
        expect(response.body[0].count).equal(1);
        expect(response.body[0].region).equal("hertfordshire");
        expect(response.body[0].date).equal("2021-09-14T07:00:00.000Z");

        expect(response.body[1].count).equal(1);
        expect(response.body[1].region).equal("hertfordshire");
        expect(response.body[1].date).equal("2021-09-14T10:00:00.000Z");

    });
    it("invalid map", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test2/analytics/time")
            .set("Accept", "application/json")
            .send(reqBody);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("map");
    });
    it("invalid hazards 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidHazard1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid hazards 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidHazard2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid sources 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidSources1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidSources2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidSources3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid regions 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidRegions1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid regions 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidRegions2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid regions 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidRegions3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid warnings 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidWarnings1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidWarnings2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidWarnings3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidWarnings4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid start date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidStartDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidStartDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidStartDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidStartDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid end date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidEndDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidEndDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidEndDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidEndDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("no end date", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(noEndDate);
        expect(response.status).equals(200);
        expect(response.body.length).equals(19);
    });
    it("for a region which is a country", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(regionCountry);
        expect(response.status).equals(200);
        expect(response.body.length).equals(19);
    });
    it("for a region which is an area", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(regionArea);
        expect(response.status).equals(200);
        expect(response.body.length).equals(5);
    });

    it("supply a text search criteria", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(textSearch);
        expect(response.status).equals(200);
        expect(response.body.length).equals(12);
    });
    it("invalid text search 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(invalidTextSearch1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("textSearch");
    });
    it("aggregate by hour not day", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/analytics/time")
            .set("Accept", "application/json")
            .send(byHour);
        expect(response.status).equals(200);
        expect(response.body.length).equals(19);
    });

});
