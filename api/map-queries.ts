/* tslint:disable:no-console */
import {AggregationMap, MapMetadata, ONE_DAY, RegionGeography, ServiceMetadata} from "./map-data.js";
import {SSDatabase} from "./db.js";
import {dateFromMillis, handleError, invalidParameter, stage} from "./util.js";

const md5 = require("md5");
const db = new SSDatabase(stage);

process.on("exit", () => {
    console.info("Closing down DB");
    db.end();
});

export const getMap = async (mapId: string): Promise<any> => {
    return (await db.sql({
                             // language=MySQL
                             sql: `select *
                                   from ref_map_metadata
                                   where id = ?`, values: [mapId]
                         }))[0];
};

let _maps;

export const getMaps = async () => {
    if (_maps) {
        return _maps;
    }
    const rows = await db.sql({
                                  // language=MySQL
                                  sql: `select *
                                        from ref_map_metadata`, values: []
                              });
    const allMaps = {};
    rows.forEach(map => allMaps[map.id] = map);
    _maps = allMaps;
    return _maps;
};


export const warningsValues = (warning: string) => {
    if (warning === "only") {
        return [1, 1];
    }
    if (warning === "include") {
        return [0, 1];
    }
    if (warning === "exclude") {
        return [0, 0];
    }
    throw new Error("Unrecognized warning option: " + warning);
};

//
// export const regionsFunc : (req, res) => Promise<void> = async (req, res) => {
//         await db.cache(res, req.path, async () => {
//             return  await db.sql({
//                                           sql:    `SELECT title as text, id as value, aggregate_level as level FROM ref_regions`,
//                                           values: {}
//                                       });
//         });
// }

// Map Related Queries
export const mapMetadataFunc: (req, res) => Promise<void> = async (req, res) => {


    await db.cache(res, req.path, async () => {
        const data = await db.sql({
                                      sql: `select *
                                            from ref_map_metadata`,
                                      values: {}
                                  });
        return {
            version: "1.0",
            maps:    data,
            start:   {
                lat:  53,
                lng:  -2,
                zoom: 6
            }

        } as ServiceMetadata;

    });


};

export const metadataForMapByIDFunc: (req, res) => Promise<void> = async (req, res) => {
    console.log("metadataForMapByIDFunc");
    await db.cache(res, req.path, async () => {

        console.log("Get Map");
        const map = await getMap(req.params.map);
        if (!map) {
            invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
            return;
        }

        console.log("Region Types");
        const regionTypes = await db.sql({
                                             // language=MySQL
                                             sql: `select region_id as id, title
                                                   from ref_map_metadata_region_types
                                                   where map_id = ?`, values: [req.params.map]
                                         });


        const regionAggregations = (await db.sql({
                                                     // language=MySQL
                                                     sql: `select region_aggregation_type_id as id
                                                           from ref_map_metadata_region_aggregations
                                                           where map_id = ?`, values: [req.params.map]
                                                 })).map(i => i.id);

        console.log("map=", map);
        return {

            id:       map.id,
            title:    map.title,
            version:  map.version,
            location: map.location,
            // hazards:           hazards.map(i => i.hazard),
            regionTypes,
            regionAggregations,
            defaultRegionType: map.default_region_type,
            start:             {
                lat:  map.start_lat,
                lng:  map.start_lng,
                zoom: map.start_zoom
            }
        } as MapMetadata;

    });

};

function getLangAsSQLLike(req): string {
    return (req.body.language || "*").replace(/\*/, "%").replace(/\?/, "_");
}

export const textForRegionsFunc: (req, res) => Promise<void> = async (req, res) => {
    try {
        const map = (await getMaps())[req.params.map];
        if (!map) {
            invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
            return;
        }
        if (typeof req.body.startDate !== "number" || req.body.startDate < 0 || req.body.startDate > Date.now()) {
            invalidParameter(res, "startDate",
                             `Invalid start date, startDate=${req.body.startDate}, startDate must be supplied, numeric, positive and less than the current time in milliseconds`);
            return;
        }
        if (typeof req.body.endDate !== "undefined") {
            if (typeof req.body.endDate !== "number" || req.body.endDate < 0 || req.body.endDate > Date.now()) {
                invalidParameter(res, "endDate",
                                 `Invalid end date, endDate=${req.body.endDate}, endDate must be numeric, positive and less than the current time in milliseconds`);
                return;
            }
        }
        if (req.body.endDate < req.body.startDate) {
            invalidParameter(res, "endDate", `Invalid end date, endDate=${req.body.endDate} (${new Date(
                req.body.endDate)}, endDate is less than startDate=${req.body.startDate} (${new Date(req.body.startDate)}`);
            return;
        }
        if (!Array.isArray(req.body.regions) || req.body.regions.some(i => typeof i !== "string") || req.body.regions.length === 0) {
            invalidParameter(res, "regions",
                             `Invalid regions, regions=${req.body.regions}, regions must be supplied as an array of strings`);
            return;
        }
        if (!Array.isArray(req.body.hazards) || req.body.hazards.some(i => typeof i !== "string") || req.body.hazards.length === 0) {
            invalidParameter(res, "hazards",
                             `Invalid hazards, hazards=${req.body.hazards}, hazards must be supplied as a non-empty array of strings`);
            return;
        }
        if (!Array.isArray(req.body.sources) || req.body.sources.some(i => typeof i !== "string") || req.body.sources.length === 0) {
            invalidParameter(res, "sources",
                             `Invalid sources, sources=${req.body.sources}, sources must be supplied as a non-empty array of strings`);
            return;
        }
        if (typeof req.body.warnings !== "string" || !["include", "exclude", "only"].includes(req.body.warnings)) {
            invalidParameter(res, "warnings",
                             `Invalid value for warnings, warnings=${req.body.warnings}, warnings must be a string with the value one of 'include', 'exclude' or 'only'`);
            return;
        }
        if (typeof req.body.language !== "undefined" && typeof req.body.language !== "string") {
            invalidParameter(res, "language",
                             `Invalid value for language, language=${req.body.language}, language is an optional parameter that is an ISO 639-1 language code, see: https://www.andiamo.co.uk/resources/iso-language-codes/. The default value is 'en'. The value stored is that which comes from the source (e.g. Twitter)`);
            return;
        }
        if (typeof req.body.pageSize !== "undefined") {
            if ((typeof req.body.pageSize !== "number") || req.body.pageSize < 0 || req.body.pageSize > 1000) {
                invalidParameter(res, "pageSize",
                                 `Invalid value for optional parameter pageSize, pageSize=${req.body.pageSize}, pageSize must be a number between (inclusively) 0 and 1000`);
                return;
            }
        }
        if (typeof req.body.page !== "undefined") {
            if ((typeof req.body.page !== "number") || req.body.page < 0) {
                invalidParameter(res, "page",
                                 `Invalid value for optional parameter page, page=${req.body.page}, page must be a positive number`);
                return;
            }
        }
        const regionType: any = req.params.regionType || req.body.regionType;
        if (typeof regionType !== "string") {
            invalidParameter(res, "regionType",
                             `Invalid value for regionType, regionType=${regionType}, regionType must supplied as a string value`);
            return;
        }
        const lastDate: Date = map.last_date;
        const endDate = calculateEndDate(map, req);
        console.debug("StartDate: " + new Date(req.body.startDate));
        console.debug("EndDate: " + new Date(endDate));
        const pageSize: number = +req.body.pageSize || 100;
        const page: number = +req.body.page || 0;
        const from = page * pageSize;
        const lang = getLangAsSQLLike(req);

        await db.cache(res, null, async () => {

            return (await db.sql({
                                     sql:
                                     // language=MySQL
                                         `/* app.ts: text_for_regions */ select t.source_json            as json,
                                                                                r.source_timestamp       as timestamp,
                                                                                r.source_id              as id,
                                                                                ST_AsGeoJSON(t.location) as location,
                                                                                r.region                 as region,
                                                                                t.possibly_sensitive     as possibly_sensitive,
                                                                                r.source                 as source,
                                                                                r.region_type            as region_type,
                                                                                r.hazard                 as hazard,
                                                                                r.warning                as warning
                                                                         FROM live_text t
                                                                                  LEFT JOIN mat_view_regions_${req.body.hazards[0]} r
                                                                                            ON t.source = r.source AND t.source_id = r.source_id AND t.hazard = r.hazard
                                                                         WHERE r.source_timestamp between ?
                                                                             AND ?
                                                                           AND r.region IN (?)
                                                                           AND r.region_type = ?
                                                                           AND r.hazard IN (?)
                                                                           AND r.source IN (?)
                                                                           AND r.warning IN (?)
                                                                           AND r.language LIKE ?
                                                                           AND not t.deleted
                                                                         order by r.source_timestamp
                                                                             desc
                                                                         LIMIT ?,?`,
                                     values: [new Date(
                                         req.body.startDate), new Date(endDate),
                                              req.body.regions,
                                              regionType,
                                              req.body.hazards,
                                              req.body.sources,
                                              warningsValues(
                                                  req.body.warnings),
                                              lang,
                                              from,
                                              pageSize
                                     ]
                                 })).map(i => {
                i.json = JSON.parse(i.json);
                return i;
            });


        }, {duration: 60});
    } catch (e) {
        handleError(res, e);
    }
};

export const textForPublicDisplayFunc: (req, res) => Promise<void> = async (req, res) => {
    try {
        const lastDate: Date = (await getMaps())[req.params.map].last_date;
        const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
        const pageSize: number = +req.body.pageSize || 100;
        const page: number = +req.body.page || 0;
        const from = page * pageSize;
        console.debug("StartDate: " + new Date(req.body.startDate));
        console.debug("EndDate: " + new Date(endDate));
        const lang = getLangAsSQLLike(req);
        await db.cache(res, null, async () => {

            return (await db.sql({
                                     sql:
                                     // language=MySQL
                                         `/* app.ts: text-for-public-display */ select t.source_json        as json,
                                                                                       r.source_timestamp   as timestamp,
                                                                                       r.source_id          as id,
                                                                                       r.region             as region,
                                                                                       t.possibly_sensitive as possibly_sensitive
                                                                                FROM live_text t
                                                                                         LEFT JOIN mat_view_regions_${req.body.hazards[0]} r
                                                                                                   ON t.source = r.source AND t.source_id = r.source_id AND t.hazard = r.hazard
                                                                                WHERE r.source_timestamp between ?
                                                                                    AND ?
                                                                                  AND r.region_type = ?
                                                                                  AND r.hazard IN (?)
                                                                                  AND r.source IN (?)
                                                                                  AND r.warning IN (?)
                                                                                  AND r.language LIKE ?
                                                                                  AND NOT t.deleted
                                                                                    ORDER BY r.source_timestamp
                                                                                        desc
                                                                                    LIMIT ?,?
                                             `,
                                     values: [new Date(req.body.startDate), new Date(endDate),
                                              req.params.regionType, req.body.hazards,
                                              req.body.sources,
                                              warningsValues(req.body.warnings), lang,
                                              from, pageSize
                                     ]
                                 }));


        }, {duration: 60 * 60});
    } catch (e) {
        handleError(res, e);
    }
};


export const csvExportFunc: (req, res) => Promise<void> = async (req, res) => {
    const lastDate: Date = (await getMaps())[req.params.map].last_date;
    const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
    const pageSize: number = +req.body.pageSize || 1000;
    const page: number = +req.body.page || 0;
    const from = page * pageSize;
    const lang = getLangAsSQLLike(req);
    console.debug("StartDate: " + new Date(req.body.startDate));
    console.debug("EndDate: " + new Date(endDate));

    await db.cache(res, null, async () => {

        return (await db.sql({
                                 sql:
                                 // language=MySQL
                                     `/* app.ts: csv_export */ select t.source_json               as json,
                                                                      t.source_html               as html,
                                                                      r.source_timestamp          as timestamp,
                                                                      r.source_id                 as id,
#                                                                             ST_AsGeoJSON(t.location)    as location,
                                                                      CASE
                                                                          WHEN r.region_relation = 0 THEN 'Default'
                                                                          WHEN r.region_relation = 1 THEN 'Set by location inference'
                                                                          WHEN r.region_relation = 2
                                                                              THEN 'Tweet location intersects the region'
                                                                          WHEN r.region_relation = 3
                                                                              THEN 'Region contains the tweet location'
                                                                          WHEN r.region_relation = 4
                                                                              THEN 'Tweet location contains the region'
                                                                          ELSE 'ERROR'
                                                                          END
                                                                                                  as location,
                                                                      rmram.region_aggregation_id as agg_region,
                                                                      t.possibly_sensitive        as possibly_sensitive,
                                                                      r.region                    as region,
                                                                      r.region_relation           as region_relation_code
                                                               FROM live_text t
                                                                        LEFT JOIN mat_view_regions r
                                                                                  ON t.source = r.source AND t.source_id = r.source_id AND t.hazard = r.hazard
                                                                        LEFT JOIN ref_map_region_aggregation_mappings rmram
                                                                                  on r.region = rmram.region AND rmram.region_type = r.region_type
                                                               WHERE r.source_timestamp between ? AND ?
                                                                 AND r.region_type = ?
                                                                 AND r.hazard IN (?)
                                                                 AND r.source IN (?)
                                                                 AND rmram.region_aggregation_id IN (?)
                                                                 AND t.warning IN (?)
                                                                 AND t.language LIKE ?
                                                                 AND not t.deleted
                                                               order by r.source_timestamp desc
                                                               LIMIT ?,?`,
                                 values: [new Date(req.body.startDate), new Date(endDate),
                                          req.body.byRegion,
                                          req.body.hazards,
                                          req.body.sources,
                                          req.body.regions,
                                          warningsValues(req.body.warnings),
                                          lang,
                                          from, pageSize
                                 ]
                             }));


    }, {duration: 60 * 60});
};


export const geographyFunc: (req, res) => Promise<void> = async (req, res) => {
    await db.cache(res, null, async () => {
        try {

            const geography = await db.sql({
                                               // language=MySQL
                                               sql: `/* app.ts: geography */ select ST_AsGeoJSON(boundary) as geo, region, gr.title
                                                                             from ref_geo_regions gr,
                                                                                  ref_map_metadata mm
                                                                             where mm.id = ?
                                                                               AND region_type = ?
                                                                               AND gr.map_location = mm.location`,
                                               values: [req.params.map,
                                                        req.params.regionType]


                                           });
            const regionGeoMap: RegionGeography = {};
            for (const row of geography) {
                regionGeoMap[row.region] = JSON.parse(row.geo);
                // tslint:disable-next-line:no-string-literal
                regionGeoMap[row.region]["properties"] = {name: row.region, title: row.title};
            }
            console.info("SUCCESS: Obtained geography.");
            return regionGeoMap;
        } catch (e) {
            console.error("FAILED: Could not get geography, hit this error ", e);
        }
    }, {duration: 24 * 60 * 60});
};


export const regionGeographyFunc: (req, res) => Promise<void> = async (req, res) => {
    await db.cache(res, null, async () => {
        try {

            const geography = await db.sql({
                                               // language=MySQL
                                               sql: `/* app.ts: geography */ select ST_AsGeoJSON(boundary) as geo, region, gr.title
                                                                             from ref_geo_regions gr,
                                                                                  ref_map_metadata mm
                                                                             where mm.id = ?
                                                                               AND region_type = ?
                                                                               AND region = ?
                                                                               AND gr.map_location = mm.location`,
                                               values: [req.params.map,
                                                        req.params.regionType,
                                                        req.params.region]


                                           });
            const result = JSON.parse(geography[0].geo);
            result.properties = {name: geography[0].region, title: geography[0].title};
            console.info("SUCCESS: Obtained geography.");
            return result;
        } catch (e) {
            console.error("FAILED: Could not get geography, hit this error ", e);
        }
    }, {duration: 24 * 60 * 60});
};

export const mapAggregationsFunc: (req, res) => Promise<void> = async (req, res) => {

    await db.cache(res, req.path, async () => {

        const aggregationTypes = await db.sql({
                                                  // language=MySQL
                                                  sql: `/* app.ts: aggregations */ select rat.id as region_aggregation_type_id, rat.title as title
                                                                                   from ref_map_metadata_region_aggregations rmmra,
                                                                                        ref_map_region_aggregation_types rat
                                                                                   where rat.id = rmmra.region_aggregation_type_id
                                                                                     AND rmmra.map_id = ?`, values: [req.params.map]
                                              });


        const aggroMap: AggregationMap = {};
        for (const aggType of aggregationTypes) {
            aggroMap[aggType.region_aggregation_type_id] = {aggregates: []};

            const aggregations = await db.sql({
                                                  // language=MySQL
                                                  sql: `select distinct ram.region_aggregation_id as region_aggregation_id,
                                                                        ra.title                  as title
                                                        from ref_map_region_aggregation_mappings ram,
                                                             ref_map_region_aggregations ra
                                                        where ra.id = ram.region_aggregation_id
                                                          AND ra.region_aggregation_type_id = ?`,
                                                  values: [aggType.region_aggregation_type_id]
                                              });
            for (const agg of aggregations) {
                const aggregationMappings = await db.sql({
                                                             // language=MySQL
                                                             sql: `select distinct ram.region      as region,
                                                                                   ram.region_type as region_type
                                                                   from ref_map_region_aggregation_mappings ram
                                                                   where ram.region_aggregation_id = ?`,
                                                             values: [agg.region_aggregation_id]
                                                         });
                const mappingsMap = {};
                for (const aggMapping of aggregationMappings) {
                    if (!mappingsMap[aggMapping.region_type]) {
                        mappingsMap[aggMapping.region_type] = [];
                    }
                    mappingsMap[aggMapping.region_type].push(aggMapping.region);
                }

                aggroMap[aggType.region_aggregation_type_id].aggregates.push(
                    {id: agg.region_aggregation_id, title: agg.title, regionTypeMap: mappingsMap});
            }

        }


        return aggroMap;
    }, {duration: 24 * 60 * 60});
};
export const recentTextCountFunc: (req, res) => Promise<void> = async (req, res) => {
    const lastDate: Date = (await getMaps())[req.params.map].last_date;
    const regionType: any = req.params.regionType || req.body.regionType;
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    if (typeof regionType !== "string") {
        invalidParameter(res, "regionType",
                         `Invalid value for regionType, regionType=${regionType}, regionType must supplied as a string value`);
        return;
    }
    if (!Array.isArray(req.body.hazards) || req.body.hazards.some(i => typeof i !== "string") || req.body.hazards.length === 0) {
        invalidParameter(res, "hazards",
                         `Invalid hazards, hazards=${req.body.hazards}, hazards must be supplied as a non-empty array of strings`);
        return;
    }
    if (!Array.isArray(req.body.sources) || req.body.sources.some(i => typeof i !== "string") || req.body.sources.length === 0) {
        invalidParameter(res, "sources",
                         `Invalid sources, sources=${req.body.sources}, sources must be supplied as a non-empty array of strings`);
        return;
    }
    if (typeof req.body.warnings !== "string" || !["include", "exclude", "only"].includes(req.body.warnings)) {
        invalidParameter(res, "warnings",
                         `Invalid value for warnings, warnings=${req.body.warnings}, warnings must be a string with the value one of 'include', 'exclude' or 'only'`);
        return;
    }
    if (typeof req.body.startDate !== "undefined") {
        if (typeof req.body.startDate !== "number" || req.body.startDate < 0 || req.body.startDate > Date.now()) {
            invalidParameter(res, "startDate",
                             `Invalid start date, startDate=${req.body.startDate}, startDate must be numeric, positive and less than the current time in milliseconds`);
            return;
        }
    }
    if (typeof req.body.language !== "undefined" && typeof req.body.language !== "string") {
        invalidParameter(res, "language",
                         `Invalid value for language, language=${req.body.language}, language is an optional parameter that is an ISO 639-1 language code, see: https://www.andiamo.co.uk/resources/iso-language-codes/. The default value is 'en'. The value stored is that which comes from the source (e.g. Twitter)`);
        return;
    }
    const lang = getLangAsSQLLike(req);
    await db.cache(res, req.path + ":" + JSON.stringify(req.body), async () => {
        const endDate = calculateEndDate(map, req);

        const rows = await db.sql({
                                      // language=MySQL
                                      sql:    `/* app.ts: recent-text-count */ SELECT r.region AS region, count(*) AS count
                                                                               FROM mat_view_regions_${req.body.hazards[0]} r
                                                                               WHERE r.region_type = ?
                                                                                 AND r.source_timestamp between ?
                                                                                   and ?
                                                                                 AND r.hazard IN (?)
                                                                                 AND r.source IN (?)
                                                                                 AND r.warning IN (?)
                                                                                 AND r.language LIKE ?
                                                                               GROUP BY r.region
                                              `,
                                      values: [regionType, new Date(req.body.startDate || endDate - 20 * 60 * 1000), new Date(endDate),
                                               req.body.hazards,
                                               req.body.sources,
                                               warningsValues(req.body.warnings), lang]
                                  });
        const result = {};
        for (const row of rows) {
            result["" + row.region] = row.count;
        }
        return result;

    }, {duration: 60});


};


export const nowFunc: (req, res) => Promise<void> = async (req, res) => {
    const lastDate: Date = (await getMaps())[req.params.map].last_date;
    const endDate: number = lastDate == null ? Date.now() : new Date(lastDate.toUTCString()).getTime();
    res.json(endDate);
};

export const mapRegionsFunc: (req, res) => Promise<void> = async (req, res) => {
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    await db.cache(res, req.path, async () => {
        return await db.sql({
                                // language=MySQL
                                sql:                            `/* app.ts: map regions for dropdown */
                                select distinct region         as value,
                                                gr.title       as text,
                                                gr.region_type as type,
                                                gr.level       as level
                                from ref_geo_regions gr,
                                     ref_map_metadata mm,
                                     (select title, max(level) as level from ref_geo_regions group by title) uniq_title
                                where not region REGEXP '^[0-9]+$'
                                  AND not gr.disabled
                                  AND gr.map_location = mm.location
                                  AND mm.id = ?
                                  AND gr.title = uniq_title.title
                                  AND gr.level = uniq_title.level
                                  AND gr.region_type <> 'bi_country'
                                order by gr.level desc, text asc`,
                                values:                         [req.params.map]
                            });
    }, {duration: 60 * 60});
};

export const allMapRegionsFunc: (req, res) => Promise<void> = async (req, res) => {
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    await db.cache(res, req.path, async () => {
        return await db.sql({
                                // language=MySQL
                                sql: `/* app.ts: map regions */ select distinct gr.region      as value,
                                                                                gr.title       as text,
                                                                                gr.region_type as type,
                                                                                gr.level       as level
                                                                from view_geo_regions_with_virtual gr,
                                                                     ref_map_metadata mm
                                                                where gr.map_location = mm.location
                                                                  AND gr.disabled = false
                                                                  AND mm.id = ?
                                                                order by level desc, text asc`,
                                values: [req.params.map]
                            });
    }, {duration: 12 * 60 * 60});

};


/**
 * This version of allMapRegionsFunc has been modified for the API as the returned keys make less sense for an API.
 * @param req
 * @param res
 */
export const allMapRegionsAPIVersionFunc: (req, res) => Promise<void> = async (req, res) => {
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    await db.cache(res, req.path, async () => {
        return await db.sql({
                                // language=MySQL
                                sql: `/* app.ts: map regions */ select distinct gr.region      as id,
                                                                                gr.title       as title,
                                                                                gr.region_type as type,
                                                                                gr.level       as level
                                                                from view_geo_regions_with_virtual gr,
                                                                     ref_map_metadata mm
                                                                where gr.map_location = mm.location
                                                                  AND gr.disabled = false
                                                                  AND mm.id = ?
                                                                order by level desc, title asc`,
                                values: [req.params.map]
                            });
    }, {duration: 12 * 60 * 60});

};


export const regionsForRegionTypeFunc: (req, res) => Promise<void> = async (req, res) => {
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    if (typeof req.params.regionType !== "string") {
        invalidParameter(res, "regionType",
                         `Invalid value for path parameter regionType, regionType=${req.params.regionType}, regionType must supplied as a string value`);
        return;
    }
    await db.cache(res, req.path, async () => {
        const rows = await db.sql({
                                      // language=MySQL
                                      sql: `/* app.ts: regionType regions */ select region

                                                                             from view_geo_regions_with_virtual gr,
                                                                                  ref_map_metadata mm
                                                                             where gr.region_type = ?
                                                                               AND gr.map_location = mm.location
                                                                               AND mm.id = ?`,
                                      values: [req.params.regionType, req.params.map]
                                  });
        const result = [];
        for (const row of rows) {
            result.push(row.region);
        }
        return result;

    }, {duration: 24 * 60 * 60});
};

function calculateEndDate(map, req): number {
    let endDate: number;
    const lastDate: Date = map.last_date;
    if (lastDate) {
        if (req.body.endDate) {
            endDate = Math.min(req.body.endDate, lastDate.getTime());
        } else {
            endDate = lastDate.getTime();
        }
    } else {
        endDate = req.body.endDate || Date.now();
    }
    console.debug("lastDate: " + lastDate);
    return endDate;
}

/**
 * Returns the data to show the exceedance AND counts on the main map. This is a highly optimized version
 * of the 'complex-stats' call. It makes a lot of assumptions AND allows only the simple enumerated AND boolean
 * criteria of hazards, sources AND warning.
 *
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *         "warnings": "include"
 *     },
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
export const statsFunc: (req, res) => Promise<void> = async (req, res) => {
    const map = (await getMaps())[req.params.map];
    if (!map) {
        invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
        return;
    }
    if (typeof req.body.startDate !== "number" || req.body.startDate < 0 || req.body.startDate > Date.now()) {
        invalidParameter(res, "startDate",
                         `Invalid start date, startDate=${req.body.startDate}, startDate must be supplied, numeric, positive and less than the current time in milliseconds`);
        return;
    }
    if (typeof req.body.endDate !== "undefined") {
        if (typeof req.body.endDate !== "number" || req.body.endDate < 0) {
            invalidParameter(res, "endDate",
                             `Invalid end date, endDate=${req.body.endDate}, endDate must be numeric and positive`);
            return;
        }
    }
    if (req.body.endDate < req.body.startDate) {
        invalidParameter(res, "endDate", `Invalid end date, endDate=${req.body.endDate} (${new Date(
            req.body.endDate)}, endDate is less than startDate=${req.body.startDate} (${new Date(req.body.startDate)}`);
        return;
    }
    if (!Array.isArray(req.body.hazards) || req.body.hazards.some(i => typeof i !== "string") || req.body.hazards.length === 0) {
        invalidParameter(res, "hazards",
                         `Invalid hazards, hazards=${req.body.hazards}, hazards must be supplied as a non-empty array of strings`);
        return;
    }
    if (!Array.isArray(req.body.sources) || req.body.sources.some(i => typeof i !== "string") || req.body.sources.length === 0) {
        invalidParameter(res, "sources",
                         `Invalid sources, sources=${req.body.sources}, sources must be supplied as a non-empty array of strings`);
        return;
    }
    if (typeof req.body.warnings !== "string" || !["include", "exclude", "only"].includes(req.body.warnings)) {
        invalidParameter(res, "warnings",
                         `Invalid value for warnings, warnings=${req.body.warnings}, warnings must be a string with the value one of 'include', 'exclude' or 'only'`);
        return;
    }

    if (typeof req.body.language !== "undefined" && typeof req.body.language !== "string") {
        invalidParameter(res, "language",
                         `Invalid value for language, language=${req.body.language}, language is an optional parameter that is an ISO 639-1 language code, see: https://www.andiamo.co.uk/resources/iso-language-codes/. The default value is 'en'. The value stored is that which comes from the source (e.g. Twitter)`);
        return;
    }

    const regionType: any = req.params.regionType || req.body.regionType;

    if (typeof regionType !== "string") {
        invalidParameter(res, "regionType",
                         `Invalid value for regionType, regionType=${regionType}, regionType must supplied as a string value`);
        return;
    }

    const lang = getLangAsSQLLike(req);
    await db.cache(res, req.path + ":" + JSON.stringify(req.body), async () => {


        const exceedanceThreshold = req.body.exceedanceThreshold || 100;
        const countThreshold = req.body.countThreshold || 0;

        const endDate = calculateEndDate(map, req);
        console.debug("map: " + map);
        console.debug("StartDate: " + new Date(req.body.startDate));
        console.debug("EndDate: " + new Date(endDate));
        const periodInDays = (endDate - req.body.startDate) / (24 * 60 * 60 * 1000);

        const rows = await db.sql({
                                      /* language=MySQL*/ sql: `/* app.ts: stats */ select *
                                                                                    from (select region,
                                                                                                 count,
                                                                                                 LEAST(round(((select count(*) + 1
                                                                                                               from (select sum(tc.text_count) as sum_count, source_date
                                                                                                                     from mat_view_text_count tc
                                                                                                                     where region_counts.region = tc.region
                                                                                                                       AND tc.region_type = ?
                                                                                                                       AND tc.hazard IN (?)
                                                                                                                       AND tc.source IN (?)
                                                                                                                       AND tc.warning IN (?)
                                                                                                                       AND tc.language LIKE ?
                                                                                                                       AND not tc.deleted
                                                                                                                     group by source_date
                                                                                                                     having sum(tc.text_count) >= ROUND(region_counts.count / ?)) re_summed_counts)
                                                                                                     /
                                                                                                              (select max(days)
                                                                                                               from mat_view_data_days d
                                                                                                               where region_counts.region = d.region
                                                                                                                 AND d.region_type = ?
                                                                                                                 AND d.hazard IN (?)
                                                                                                                 AND d.source IN (?)
                                                                                                                 AND d.warning IN (?)
                                                                                                                 AND d.language LIKE ?)
                                                                                                                 ) * 100, 2),
                                                                                                       100) as exceedance

                                                                                          FROM (SELECT count(*) as count, region as region
                                                                                                FROM mat_view_regions_${req.body.hazards[0]} r
                                                                                                WHERE r.source_timestamp between ?
                                                                                                    AND ?
                                                                                                  AND r.region_type = ?
                                                                                                  AND r.hazard IN (?)
                                                                                                  AND r.source IN (?)
                                                                                                  AND r.warning IN (?)
                                                                                                  AND r.language LIKE ?
                                                                                                  AND NOT r.deleted
                                                                                                group by region) as region_counts) as x
                                                                                    where exceedance <= ?
                                                                                      AND count > ?;
                                                               `,

                                      values: [
                                          regionType, req.body.hazards, req.body.sources,
                                          warningsValues(req.body.warnings), lang,
                                          periodInDays,

                                          regionType, req.body.hazards, req.body.sources,
                                          warningsValues(req.body.warnings), lang,

                                          new Date(req.body.startDate), new Date(endDate),
                                          regionType, req.body.hazards, req.body.sources,
                                          warningsValues(req.body.warnings), lang,

                                          exceedanceThreshold, countThreshold

                                      ]
                                  }, true);

        if (req.body.format === "geojson") {
            const featureMap = {};
            const regions = await db.sql(
                {sql: "select region, ST_AsGeoJSON(boundary) geojson from ref_geo_regions where region_type = ?", values: [regionType]});
            for (const region of regions) {
                featureMap[region.region] = JSON.parse(region.geojson);
                featureMap[region.region].properties = {name: region.region, count: 0, exceedance: 100.0};
            }
            for (const row of rows) {
                featureMap[row.region].properties = {name: row.region, count: row.count, exceedance: row.exceedance};
            }

            return {type: "FeatureCollection", features: Object.values(featureMap)};
        } else {
            const result = {};
            for (const row of rows) {
                if (req.body.debug) {
                    console.info("Fetching row ", row);
                }

                result[row.region] = {count: row.count, exceedance: row.exceedance};
            }
            return result;
        }


    }, {duration: 5 * 60});

};


/**
 * Returns the data for a timeseries graph on the give map.
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *     },
 *     "regions":["wales","england"],
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */

export const accurateStatsFunc: (req, res) => Promise<void> = async (req, res) => {

    await db.cache(res, req.path + ":" + JSON.stringify(req.body), async () => {

        const firstDateInSeconds = (await db.sql({
                                                     // language=MySQL
                                                     sql: `select unix_timestamp(max(source_timestamp)) as ts
                                                           from mat_view_first_entries
                                                           where hazard IN (?)
                                                             AND source IN (?)`, values: [req.body.hazards, req.body.sources]
                                                 }))[0].ts;
        console.debug("First date in seconds: " + firstDateInSeconds);
        const result = {};

        const lastDate: Date = (await getMaps())[req.params.map].last_date;
        const endDate: number = lastDate == null ? req.body.endDate : Math.min(req.body.endDate, lastDate.getTime());
        const start = Math.floor(req.body.startDate / 1000);
        const end = Math.floor(endDate / 1000);
        // Th period length is also rounded to the hour to reduce the number of possible queries.
        const periodLengthInSeconds: number = Math.ceil(Math.min(end - start) / 3600) * 3600;
        const maxPeriods: number = (end - firstDateInSeconds) / periodLengthInSeconds;
        const exceedanceThreshold = req.body.exceedanceThreshold || 100;
        const countThreshold = req.body.countThreshold || 0;
        const lang = getLangAsSQLLike(req);

        console.debug("Period Length in Seconds: " + periodLengthInSeconds);
        console.debug("StartDate: " + new Date(req.body.startDate));
        console.debug("EndDate: " + new Date(endDate));
        console.debug("Start: " + new Date(start * 1000));
        console.debug("End: " + new Date(end * 1000));

        const rows = await db.sql({
                                      sql:
                                      /* @formatter:off */
                                      /* language=MySQL*/
                                          `/* app.ts: accurate-stats */
                                        SELECT * FROM
                                          (SELECT
                                               (SELECT exceedance from (select cume_dist() OVER w * 100.0   as exceedance,
                                                                               rhs.period as period,
                                                                               IFNULL(lhs.count, rhs.count) as count
                                                                        FROM
                                                                            (SELECT count(source_id) as count,
                                                                                    floor((? - unix_timestamp(r.source_timestamp)) / ?) as period
                                                                             FROM mat_view_regions_${req.body.hazards[0]} r
                                                                             WHERE r.region = regions.region
                                                                               AND r.region_type = ?
                                                                               AND r.hazard IN (?)
                                                                               AND r.source IN (?)
                                                                               AND r.warning IN (?)
                                                                               AND r.language LIKE ?
                                                                               AND NOT r.deleted
                                                                             GROUP BY period
                                                                             ORDER BY period) lhs
                                                                                RIGHT OUTER JOIN
                                                                                (SELECT value as period,
                                                                                        0 as count
                                                                                 FROM ref_integers
                                                                                 WHERE value < ?) rhs
                                                                                    ON lhs.period = rhs.period
                                                                        WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                                                                        ) x
                                                                  WHERE period = 0 AND count > 0)  as exceedance,
                                               (SELECT count(*) as count
                                                FROM mat_view_regions_${req.body.hazards[0]} r
                                                WHERE r.region = regions.region
                                                  AND r.region_type = ?
                                                  AND r.hazard IN (?)
                                                  AND r.source IN (?)
                                                  AND r.warning IN (?)
                                                  AND r.language LIKE ?
                                                  AND NOT r.deleted
                                                  AND r.source_timestamp between ? AND ?) as count,
                                               regions.region as region
                                           FROM (SELECT DISTINCT region from ref_geo_regions where region_type = ?)
                                               as regions) as x
                                      WHERE x.exceedance < ?
                                        AND x.count > ?                  `,
                                      /* @formatter:on */

                                      values: [end,
                                               periodLengthInSeconds,
                                               req.params.regionType, req.body.hazards, req.body.sources,
                                               warningsValues(req.body.warnings), lang,
                                               maxPeriods,
                                               req.params.regionType, req.body.hazards, req.body.sources,
                                               warningsValues(req.body.warnings), lang,

                                               new Date(req.body.startDate), new Date(req.body.endDate),
                                               req.params.regionType,
                                               exceedanceThreshold,
                                               countThreshold
                                      ]
                                  }, true);


        for (const row of rows) {
            if (req.body.debug) {
                console.info("Fetching row ", row);
            }

            result["" + row.region] = {count: row.count, exceedance: row.exceedance};
        }

        return result;

    }, {duration: 5 * 60});

};
/**
 * Returns the data for a timeslider on the map.
 *
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *     },
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
export const timesliderFunc: (req, res) => Promise<void> = async (req, res) => {
    console.log("Timeslider query " + req.params.map, req.body);
    const lastDateInDB: any = (await getMaps())[req.params.map].last_date;
    const location: any = (await getMaps())[req.params.map].location;
    const key = req.params.map + ":" + JSON.stringify(req.body);
    const lang = getLangAsSQLLike(req);

    await db.cache(res, key, async () => {
        const dayTimePeriod: boolean = req.body.timePeriod === "day";
        const timeSeriesTable = dayTimePeriod ? "mat_view_timeseries_date" : "mat_view_timeseries_hour";
        const dateTable = dayTimePeriod ? "mat_view_days" : "mat_view_hours";
        const from: Date = dateFromMillis(req.body.startDate || req.body.from);
        const to: Date = lastDateInDB ? dateFromMillis(Math.min(req.body.endDate || req.body.to, lastDateInDB.getTime())) : dateFromMillis(
            req.body.endDate || req.body.to);
        const hazards: string[] = req.body.hazards || req.body.layer.hazards;
        const sources: string[] = req.body.sources || req.body.layer.sources;
        return await db.sql({
                                // language=MySQL
                                sql:    `/* app.js timeslider */ select IFNULL(lhs.count, rhs.count) as count,
                                                                        IFNULL(lhs.date, rhs.date)   as date
                                                                 from (SELECT count(*)        as count,
                                                                              tsd.source_date as date
                                                                       FROM ${timeSeriesTable} tsd
                                                                       WHERE tsd.source_date between ? and ?
                                                                         AND tsd.hazard IN (?)
                                                                         AND tsd.language LIKE ?
                                                                         AND tsd.source IN (?)
                                                                         AND NOT tsd.deleted
                                                                         AND tsd.map_location = ?
                                                                       group by date
                                                                       order by date) lhs
                                                                          RIGHT OUTER JOIN (select date, 0 as count
                                                                                            from ${dateTable}
                                                                                            where date between ? and ?) rhs
                                                                                           ON lhs.date = rhs.date
                                        `,
                                values: [from, to, hazards, lang, sources, location, from, to]
                            });

    }, {duration: 60 * 60});
};


/**
 * Returns the data for a timeseries graph on the give map.
 * @example JSON body
 *
 * {
 *     "layer" : {
 *         "hazards" : ["flood","wind"]
 *         "sources" :["twitter"]
 *     },
 *     "regions":["wales","england"],
 *     "from": 1634911245041,
 *     "to": 1634911245041,
 * }
 *
 *
 */
export const timeseriesFunc: (req, res) => Promise<void> = async (req, res) => {
    try {
        const map = (await getMaps())[req.params.map];
        if (!map) {
            invalidParameter(res, "map", `Unrecognized map ${req.params.map}`);
            return;
        }
        if (typeof req.body.startDate !== "number" || req.body.startDate < 0 || req.body.startDate > Date.now()) {
            invalidParameter(res, "startDate",
                             `Invalid start date, startDate=${req.body.startDate}, startDate must be supplied, numeric, positive and less than the current time in milliseconds`);
            return;
        }
        if (typeof req.body.endDate !== "undefined") {
            if (typeof req.body.endDate !== "number" || req.body.endDate < 0 || req.body.endDate > Date.now()) {
                invalidParameter(res, "endDate",
                                 `Invalid end date, endDate=${req.body.endDate}, endDate must be numeric, positive and less than the current time in milliseconds`);
                return;
            }
        }
        if (req.body.endDate < req.body.startDate) {
            invalidParameter(res, "endDate", `Invalid end date, endDate=${req.body.endDate} (${new Date(
                req.body.endDate)}, endDate is less than startDate=${req.body.startDate} (${new Date(req.body.startDate)}`);
            return;
        }
        if (!Array.isArray(req.body.regions) || req.body.regions.some(i => typeof i !== "string")) {
            invalidParameter(res, "regions",
                             `Invalid regions, regions=${req.body.regions}, regions must be an array of strings.`);
            return;
        }
        if (!Array.isArray(req.body.hazards) || req.body.hazards.some(i => typeof i !== "string") || req.body.hazards.length === 0) {
            invalidParameter(res, "hazards",
                             `Invalid hazards, hazards=${req.body.hazards}, hazards must be supplied as a non-empty array of strings`);
            return;
        }
        if (!Array.isArray(req.body.sources) || req.body.sources.some(i => typeof i !== "string") || req.body.sources.length === 0) {
            invalidParameter(res, "sources",
                             `Invalid sources, sources=${req.body.sources}, sources must be supplied as a non-empty array of strings`);
            return;
        }
        if (typeof req.body.warnings !== "string" || !["include", "exclude", "only"].includes(req.body.warnings)) {
            invalidParameter(res, "warnings",
                             `Invalid value for warnings, warnings=${req.body.warnings}, warnings must be a string with the value one of 'include', 'exclude' or 'only'`);
            return;
        }
        if (typeof req.body.timePeriod != "undefined") {
            if (typeof req.body.timePeriod !== "string" || !["day", "hour"].includes(req.body.timePeriod)) {
                invalidParameter(res, "timePeriod",
                                 `Invalid value for timePeriod, timePeriod=${req.body.timePeriod}, timePeriod is a string with the value one of 'day' or 'hour'`);
                return;
            }
        }
        if (typeof req.body.textSearch !== "undefined") {
            if (typeof req.body.textSearch !== "string" || req.body.textSearch === "") {
                invalidParameter(res, "textSearch",
                                 `Invalid value for textSearch, textSearch=${req.body.textSearch}, textSearch must be a string value`);
                return;
            }
        }

        if (typeof req.body.language !== "undefined" && typeof req.body.language !== "string") {
            invalidParameter(res, "language",
                             `Invalid value for language, language=${req.body.language}, language is an optional parameter that is an ISO 639-1 language code, see: https://www.andiamo.co.uk/resources/iso-language-codes/. The default value is 'en'. The value stored is that which comes from the source (e.g. Twitter)`);
            return;
        }
        console.log("Analytics time query " + req.params.map, req.body);
        const lastDateInDB: any = map.last_date;
        const location: any = map.location;
        const key = req.params.map + ":" + JSON.stringify(req.body);
        // They can either be grouped into a notional layer or top level properties
        const hazards: string[] = req.body.hazards;
        const sources: string[] = req.body.sources;
        const regions: string[] = req.body.regions;
        const lang = getLangAsSQLLike(req);
        const from: Date = dateFromMillis(req.body.startDate);
        const to = new Date(calculateEndDate(map, req));


        if (req.body.timePeriod === "day" && (to.getTime() - from.getTime()) / ONE_DAY > 367) {
            invalidParameter(res, "startDate/endDate",
                             `The gap between the start date ${from} and the end date ${to} exceeds the maximum of 367 days, for by day analytics. Please break down the request into smaller chunks.`);
            return;
        }

        if (req.body.timePeriod === "hour" && (to.getTime() - from.getTime()) / ONE_DAY > 32) {
            invalidParameter(res, "startDate/endDate",
                             `The gap between the start date ${from} and the end date ${to} exceeds the maximum of 32 days, for by hour analytics. Please break down the request into smaller chunks.`);
            return;
        }

        await db.cache(res, key, async () => {
            let fullText = "";
            let textSearch: string = req.body.textSearch;

            if (typeof textSearch !== "undefined" && textSearch.length > 0) {
                // fullText = " AND MATCH (tsd.source_text) AGAINST(? IN BOOLEAN MODE)";
                fullText = " AND tsd.source_text LIKE ? ";
                textSearch = `%${textSearch}%`;
                // let additionalQuery = "+(";
                // for (const source of sources) {
                //     for (const hazard of hazards) {
                //         for (const region of regions) {
                //             additionalQuery += md5(source + ":" + hazard + ":" + region) + " ";
                //         }
                //     }
                // }
                // additionalQuery += ") ";
                // textSearch = additionalQuery + "+(" + textSearch + ")";
                console.log("Amended text search is '" + textSearch + "'");
            }
            const dayTimePeriod: boolean = req.body.timePeriod === "day";
            const timeSeriesTable = dayTimePeriod ? "mat_view_timeseries_date" : "mat_view_timeseries_hour";
            const dateTable = dayTimePeriod ? "mat_view_days" : "mat_view_hours";


            if (!regions || regions.length === 0) {
                const values = fullText ? [hazards, sources, lang, location, textSearch, from, to] : [hazards, sources,
                                                                                                      lang, location, from, to];

                // Important note: The limit of now() - interval 2 year on the join with date table is to coincide with
                // the limit placed on historical data due to performance issues. If the restriction is removed for
                // the mat_view_timeseries_date and mat_view_timeseries_hour tables in refresh_mv_now.sql then
                // it must also be removed here.

                return await db.sql({
                                        // language=MySQL
                                        sql: `select *
                                              from (select IFNULL(lhs.count, rhs.count)         as count,
                                                           'all'                                as region,
                                                           round(1.0 / (cume_dist() OVER w), 2) as exceedance,
                                                           lhs.date                             as date
                                                    from (SELECT count(*)        as count,
                                                                 tsd.source_date as date

                                                          FROM ${timeSeriesTable} tsd
                                                          WHERE tsd.hazard IN (?)
                                                            AND tsd.source IN (?)
                                                            AND tsd.language LIKE ?
                                                            AND tsd.map_location = ? ${fullText}
                                                          AND NOT tsd.deleted
                                                          group by date
                                                          order by date) lhs
                                                             RIGHT OUTER JOIN (select date, 0 as count
                                                                               from ${dateTable}
                                                                               where date > now() - interval 2 year) rhs
                                                                              ON lhs.date = rhs.date
                                                        WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                                                    order by date) x
                                              where date between ? AND ?
                                              order by date`,
                                        values
                                    });
            } else {
                console.log("Regions specified", regions);
                const values = fullText ? [regions, hazards, sources, lang, location, textSearch, from, to] : [regions,
                                                                                                               hazards,
                                                                                                               sources,
                                                                                                               lang,
                                                                                                               location, from,
                                                                                                               to];
                console.log("Values:", values);
                return await db.sql({
                                        // language=MySQL
                                        sql: `select *
                                              from (select IFNULL(lhs.count, rhs.count)         as count,
                                                           region,
                                                           round(1.0 / (cume_dist() OVER w), 2) as exceedance,
                                                           lhs.date                             as date
                                                    from (SELECT count(tsd.source_date) as count,
                                                                 tsd.source_date        as date,
                                                                 tsd.region_group_name  as region
                                                          FROM ${timeSeriesTable} tsd
                                                          WHERE tsd.region_group_name IN (?)
                                                            AND tsd.hazard IN (?)
                                                            AND tsd.source IN (?)
                                                            AND tsd.language LIKE ?
                                                            AND tsd.map_location = ? ${fullText}
                                                        AND NOT tsd.deleted
                                                          group by date, region
                                                          order by date) lhs
                                                             RIGHT OUTER JOIN (select date, 0 as count from ${dateTable} where date > now() - interval 2 year) rhs
                                                                              ON lhs.date = rhs.date
                                                        WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)) x
                                              where date between ? AND ?
                                              order by date`, values

                                    });
            }
        }, {duration: 7 * 24 * 60 * 60});
    } catch (e) {
        handleError(res, e);
    }
};
