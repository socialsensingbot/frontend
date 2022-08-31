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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPageSize1 = {
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
    pageSize:   -2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPageSize2 = {
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
    pageSize:   "2",
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPageSize3 = {
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
    pageSize:   1001,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const noPageSize = {
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
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPage1 = {
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
    pageSize:   2,
    page:       -1,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPage2 = {
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
    pageSize:   2,
    page:       "1",
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const invalidPage3 = {
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
    pageSize:   2,
    page:       [],
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
};
const largePageNumber = {
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
    pageSize:   2,
    page:       100000,
    startDate:  MIN_DATE_MILLIS,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  -1,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  "Wed Apr  6 18:11:20 BST 2022",
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  4796668800000,
    endDate:    MAX_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    -1,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    "Wed Apr  6 18:11:20 BST 2022",
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    endDate:    4796668800000,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
    startDate:  MAX_DATE_MILLIS,
    endDate:    MIN_DATE_MILLIS,
    regionType: "county"
};
const noEndDate = {
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
    pageSize:   2,
    page:       0,
    startDate:  MIN_DATE_MILLIS,
    regionType: "county"
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
    pageSize:   2,
    page:       0,
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
    pageSize:   2,
    page:       0,
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
    pageSize:   2,
    page:       0,
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
describe("POST /v1/map/:map/text", () => {
    it("single region", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(reqBody);
        console.log(JSON.stringify(response.body));
        expect(response.body.length).equal(2);
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
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidHazard1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid hazards 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidHazard2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("hazards");
    });
    it("invalid sources 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidSources1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidSources2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid sources 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidSources3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("sources");
    });
    it("invalid regions 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegions1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid regions 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegions2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid regions 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegions3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regions");
    });
    it("invalid warnings 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidWarnings1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidWarnings2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidWarnings3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid warnings 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidWarnings4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("warnings");
    });
    it("invalid page size 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPageSize1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("pageSize");
    });
    it("invalid page size 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPageSize2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("pageSize");
    });
    it("invalid page size 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPageSize3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("pageSize");
    });
    it("no page size specified", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(noPageSize);
        expect(response.status).equals(200);
        expect(response.body.length, "default page size of 100").equals(100);
    });
    it("invalid page 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPage1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("page");
    });
    it("invalid page 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPage2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("page");
    });
    it("invalid page 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidPage3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("page");
    });
    it("large page number", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(largePageNumber);
        expect(response.status).equals(200);
        expect(response.body.length, "zero results").equals(0);
    });
    it("invalid start date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidStartDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidStartDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidStartDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid start date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidStartDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("startDate");
    });
    it("invalid end date 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidEndDate1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidEndDate2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidEndDate3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("invalid end date 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidEndDate4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("endDate");
    });
    it("no end date", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(noEndDate);
        expect(response.status).equals(200);
        expect(response.body.length).equals(2);
    });
    it("invalid region type 1", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegionType1);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 2", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegionType2);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 3", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegionType3);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
    it("invalid region type 4", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/text")
            .set("Accept", "application/json")
            .send(invalidRegionType4);
        expect(response.status).equals(400);
        expect(response.body.parameter).equals("regionType");
    });
});
