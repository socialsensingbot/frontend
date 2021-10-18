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
        const dateTable = params.timePeriod === "day" ? "mat_view_days" : "mat_view_hours";
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            const values = fullText ? [params.layer.hazards, params.layer.sources, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.layer.hazards, params.layer.sources,
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
                                  WHERE tsd.hazard IN (?)
                                    and tsd.map_location = 'uk'
                                    and tsd.source IN (?)
                                      ${fullText}
                                  group by date
                                  order by date) lhs
                                     RIGHT OUTER JOIN (select date, 0 as count
                                                       from ${dateTable}) rhs
                                                      ON lhs.date = rhs.date
                                WINDOW w AS (ORDER BY IFNULL(lhs.count, rhs.count) desc)
                            order by date) x
                      where date between ? and ?
                      order by date `,
                values
            };
        } else {
            const values = fullText ? [params.regions, params.layer.hazards, params.layer.sources,
                                       params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.regions, params.layer.hazards, params.layer.sources,

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
                                  WHERE tsd.region_group_name IN (?)
                                    and tsd.hazard IN (?)
                                    and tsd.source IN (?)
                                    and tsd.map_location = 'uk'
                                      ${fullText}
                                  group by date, region
                                  order by date
                                 ) lhs
                                     RIGHT OUTER JOIN (select date, 0 as count from ${dateTable}) rhs
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
