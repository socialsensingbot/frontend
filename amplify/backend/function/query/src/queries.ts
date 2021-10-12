/*
 * © 2020 All rights reserved.
 */

import {QueryOptions} from "mysql";

const dateFromMillis = (time: number) => {
    const dateTime = new Date(time);
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
};


export const queries: { [id: string]: (params) => QueryOptions } = {
    ref_map_metadata: (params: any) => {
        return {
            sql: `select *
                  from ref_map_metadata`,
            values: {}
        };
    },
    time:             (params: any) => {
        let fullText = "";
        if (typeof params.textSearch !== "undefined" && params.textSearch.length > 0) {
            fullText = " and MATCH (tsd.source_text) AGAINST(? IN BOOLEAN MODE) ";
        }
        const timeSeriesTable = params.timePeriod === "day" ? "mat_view_timeseries_date" : "mat_view_timeseries_hour";
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            const values = fullText ? [params.layer.sources, params.layer.hazards, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.layer.sources, params.layer.hazards,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)
            ];
            return {
                // language=MySQL
                sql: `select *
                      from (select IFNULL(lhs.count, rhs.count) as count,
                                   'all'                        as region,
                                   1.0 / (cume_dist() OVER w)   as exceedance,
                                   lhs.date                     as date
                            from (SELECT count(*)        as count,
                                         tsd.source_date as date

                                  FROM ${timeSeriesTable} tsd
                                  WHERE source IN (?)
                                    and hazard IN (?)
                                      ${fullText}
                                  group by date
                                  order by date) lhs
                                     RIGHT OUTER JOIN (select distinct source_date as date, 0 as count
                                                       from ${timeSeriesTable}) rhs
                                                      ON lhs.date = rhs.date
                                WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                            order by date) x
                      where date between ? and ?
                      order by date `,
                values
            };
        } else {
            const values = fullText ? [params.layer.sources, params.layer.hazards,
                                       params.regions, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.layer.sources, params.layer.hazards,
                                                                     params.regions,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)];
            return {
                // language=MySQL
                sql: `select *
                      from (select IFNULL(lhs.count, rhs.count) as count, region, 1.0 / (cume_dist() OVER w) as exceedance, lhs.date as date
                            from (SELECT count(tsd.source_date) as count,
                                         tsd.source_date        as date,
                                         tsd.region_group_name  as region
                                  FROM ${timeSeriesTable} tsd
                                  WHERE tsd.source IN (?)
                                    and tsd.hazard IN (?)
                                    and tsd.region_type = 'county'
                                    and tsd.region_group_name IN (?)
                                      ${fullText}
                                  group by date, region
                                  order by date
                                 ) lhs
                                     RIGHT OUTER JOIN (select distinct source_date as date, 0 as count
                                                       from ${timeSeriesTable}) rhs
                                                      ON lhs.date = rhs.date
                                WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                           ) x
                      where date between ? and ?
                      order by date`,
                values
            };

        }
    }

};
