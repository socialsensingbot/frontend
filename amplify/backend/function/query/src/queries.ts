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
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            return {
                sql: `SELECT sum(message_count) as count, aggregate_date as date, avg(exceedence) as exceedence, 'all' as region
                      FROM aggregate_counts_by_region
                      WHERE source = ?
                        and hazard = ?
                        and aggregate_date between ? and ?
                      group by aggregate_date
                      order by aggregate_date`,
                values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to)]
            };
        } else {
            return {
                sql: `SELECT message_count as count, aggregate_date as date, exceedence, region
                      FROM aggregate_counts_by_region
                      WHERE source = ?
                        and hazard = ?
                        and aggregate_date between ? and ?
                        and region in (?)
                      order by aggregate_date`,
                values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                         params.regions]
            };
        }
    },
    count_by_date_for_regions_and_fulltext: (params: any) => {
        let fullText = "";
        if (typeof params.textSearch !== "undefined" && params.textSearch.length > 0) {
            fullText = " and MATCH (source_text) AGAINST(? IN NATURAL LANGUAGE MODE) ";
        }
        if( !params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            return {
                sql: `SELECT count(*) as count, source_date as date, 'all' as region_1, '' as region_2, '' as region_3
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
            sql: `SELECT sum(message_count) as count, aggregate_date as date, max(exceedence) as exceedence, 'all' as region
                  FROM aggregate_counts_by_region
                  WHERE source = ?
                    and hazard = ?
                    and aggregate_date between ? and ?
                  group by aggregate_date
                  order by aggregate_date`,
            values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to)]
        };

    }

};

