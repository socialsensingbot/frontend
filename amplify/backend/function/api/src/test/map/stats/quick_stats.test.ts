import * as request from "supertest";
import {expect} from "chai";
import {MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../constants";
import * as app from "../../../app";

const expectedResult = {
        "dumfries and galloway":    {count: 2, exceedance: 3.5491},
        "greater london":           {count: 172, exceedance: 0.7307},
        "west sussex":              {count: 1, exceedance: 26.2526},
        kent:                       {count: 2, exceedance: 24.2693},
        gloucestershire:            {count: 1, exceedance: 27.8184},
        wiltshire:                  {count: 3, exceedance: 4.2276},
        "argyll and bute":          {count: 1, exceedance: 10.9603},
        hertfordshire:              {count: 2, exceedance: 16.9624},
        buckinghamshire:            {count: 1, exceedance: 23.8518},
        cumbria:                    {count: 1, exceedance: 37.2651},
        herefordshire:              {count: 1, exceedance: 17.6409},
        essex:                      {count: 4, exceedance: 8.3507},
        cheshire:                   {count: 1, exceedance: 31.9415},
        "west midlands":            {count: 2, exceedance: 24.1127},
        "south yorkshire":          {count: 2, exceedance: 17.2756},
        highland:                   {count: 1, exceedance: 22.0251},
        "west yorkshire":           {count: 4, exceedance: 12.0564},
        northamptonshire:           {count: 2, exceedance: 11.8476},
        surrey:                     {count: 1, exceedance: 48.3299},
        cambridgeshire:             {count: 18, exceedance: 0.4175},
        "blackburn with darwen":    {count: 1, exceedance: 5.7411},
        "greater manchester":       {count: 2, exceedance: 41.6493},
        peterborough:               {count: 1, exceedance: 9.6033},
        staffordshire:              {count: 1, exceedance: 41.8058},
        newport:                    {count: 1, exceedance: 13.2568},
        lancashire:                 {count: 1, exceedance: 44.4154},
        louth:                      {count: 1, exceedance: 4.6973},
        "glasgow city":             {count: 3, exceedance: 12.3173},
        thurrock:                   {count: 2, exceedance: 1.6701},
        norfolk:                    {count: 2, exceedance: 18.8935},
        "southend-on-sea":          {count: 1, exceedance: 2.6096},
        worcestershire:             {count: 1, exceedance: 42.1712},
        hampshire:                  {count: 1, exceedance: 37.8392},
        halton:                     {count: 1, exceedance: 3.0271},
        lincolnshire:               {count: 1, exceedance: 29.6451},
        derby:                      {count: 1, exceedance: 11.6388},
        derbyshire:                 {count: 1, exceedance: 37.5261},
        "east riding of yorkshire": {count: 1, exceedance: 14.2484},
        leicestershire:             {count: 1, exceedance: 39.1441},
        "north lincolnshire":       {count: 1, exceedance: 6.524},
        "bristol, city of":         {count: 1, exceedance: 31.5762}
    }
;
const noEndateExpectedResult = {
    "dumfries and galloway":        {count: 138, exceedance: 10.1253},
    "greater london":               {count: 2561, exceedance: 16.858},
    "west sussex":                  {count: 200, exceedance: 26.2526},
    kent:                           {count: 270, exceedance: 47.547},
    hertfordshire:                  {count: 162, exceedance: 38.7265},
    cumbria:                        {count: 650, exceedance: 8.977},
    essex:                          {count: 290, exceedance: 40.3967},
    cheshire:                       {count: 218, exceedance: 31.9415},
    "west midlands":                {count: 213, exceedance: 46.6597},
    "south yorkshire":              {count: 509, exceedance: 17.2756},
    highland:                       {count: 143, exceedance: 22.0251},
    "west yorkshire":               {count: 679, exceedance: 17.5887},
    surrey:                         {count: 360, exceedance: 24.3737},
    cambridgeshire:                 {count: 159, exceedance: 34.3424},
    "greater manchester":           {count: 965, exceedance: 15.2923},
    staffordshire:                  {count: 235, exceedance: 41.8058},
    lancashire:                     {count: 368, exceedance: 20.1983},
    "glasgow city":                 {count: 569, exceedance: 12.3173},
    norfolk:                        {count: 206, exceedance: 38.7265},
    worcestershire:                 {count: 311, exceedance: 19.9896},
    hampshire:                      {count: 170, exceedance: 37.8392},
    derbyshire:                     {count: 383, exceedance: 16.9624},
    leicestershire:                 {count: 180, exceedance: 39.1441},
    "bristol, city of":             {count: 144, exceedance: 31.5762},
    dorset:                         {count: 188, exceedance: 30.7933},
    "north yorkshire":              {count: 434, exceedance: 25.5741},
    "city of edinburgh":            {count: 164, exceedance: 33.4551},
    suffolk:                        {count: 208, exceedance: 41.023},
    merseyside:                     {count: 241, exceedance: 35.0731},
    nottinghamshire:                {count: 127, exceedance: 30.7411},
    dublin:                         {count: 193, exceedance: 39.8747},
    somerset:                       {count: 123, exceedance: 31.1587},
    "tyne and wear":                {count: 214, exceedance: 30.6367},
    shropshire:                     {count: 327, exceedance: 13.8309},
    oxfordshire:                    {count: 165, exceedance: 37.9436},
    cork:                           {count: 252, exceedance: 32.1503},
    warwickshire:                   {count: 110, exceedance: 30.0626},
    "cornwall and isles of scilly": {count: 191, exceedance: 36.5344},
    cardiff:                        {count: 116, exceedance: 23.904},
    powys:                          {count: 142, exceedance: 17.8497},
    devon:                          {count: 478, exceedance: 28.1315},
    wexford:                        {count: 146, exceedance: 5.5324},
    northumberland:                 {count: 156, exceedance: 26.618}
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
    it("single region", async () => {
        const response = await request(app)
            .post("/v1/map/uk-flood-test/stats")
            .set("Accept", "application/json")
            .send(reqBody);
        console.log(JSON.stringify(response.body));
        expect(JSON.stringify(response.body)).to.equal(JSON.stringify(expectedResult));
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
