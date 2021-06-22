/*
 * © 2020 All rights reserved.
 */

import {QueryOptions} from "mysql";

const dateFromMillis = (time: number) => {
    const dateTime = new Date(time);
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
};


export const queries: { [id: string]: (params) => QueryOptions } = {
    count_by_date_for_regions:              (params: any) => {
        return {
            sql: `SELECT count(source_date) as count, source_date as date, region_1, region_2, region_3
                  FROM text_by_region
                  WHERE source = ?
                    and hazard = ?
                    and source_date between ? and ?
                    and region_1 in (?)
                  group by source_date, region_1, region_2, region_3
                  order by source_date`,
            values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                     params.regions]
        };
    },
    count_by_date_for_regions_and_fulltext: (params: any) => {
        let fullText = "";
        if (typeof params.textSearch !== "undefined" && params.textSearch.length > 0) {
            fullText = " and MATCH (source_text) AGAINST(? IN NATURAL LANGUAGE MODE) ";
        }
        if (params.regions.includes("*") || params.regions.length === 0) {
            return {
                sql: `SELECT count(*) as count, source_date as date
                      FROM text_by_region
                      WHERE source = ?
                        and hazard = ?
                        and source_date between ? and ? ${fullText}
                      group by source_date
                      order by source_date`,
                values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                         params.textSearch]
            };
        } else {
            return {
                sql: `SELECT count(*) as count, source_date as date, region_1, region_2, region_3
                      FROM text_by_region
                      WHERE source = ?
                        and hazard = ?
                        and source_date between ? and ?
                        and region_1 in (?)
                          ${fullText}
                      group by source_date, region_1, region_2, region_3
                      order by source_date`,
                values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                         params.regions, params.textSearch]
            };

        }
    },
    count_by_date_for_all_regions:          (params: any) => {
        return {
            sql: `SELECT count(source_date) as count, source_date as date
                  FROM text_by_region
                  WHERE source = ?
                    and hazard = ?
                    and source_date between ? and ?
                  group by source_date
                  order by source_date`,
            values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to)]
        };
    }

};

