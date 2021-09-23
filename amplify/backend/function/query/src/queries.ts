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
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            const values = fullText ? [params.layer.sources, params.layer.hazards, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.layer.sources, params.layer.hazards,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)];
            return {
                sql: `select *
                      from (SELECT count(*) as count,
                                   tsd.source_date as date,
                                   'all'       as region,  1.0 / (cume_dist()  OVER w) as exceedance 
                            FROM mat_view_timeseries_date tsd
                            WHERE source IN (?)
                              and hazard IN (?) ${fullText}
                            group by tsd.source_date
                                WINDOW w AS (ORDER BY COUNT(tsd.source_date) desc)
                            order by tsd.source_date) x
                      where date between ? and ? `,
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
                sql: `select *
                      from (SELECT count(tsd.source_date) as count,
                                   tsd.source_date       as date,
                                   tsd.region_group_name             as region,  
                                   1.0 / (cume_dist()  OVER w) as exceedance 
                            FROM mat_view_timeseries_date tsd
                            WHERE tsd.source IN (?)
                              and tsd.hazard IN (?)
                              and tsd.region_type = 'county'
                              and tsd.region_group_name IN (?) 
                              ${fullText}
                            group by  tsd.source_date, tsd.region_group_name
                                WINDOW w AS (ORDER BY COUNT(tsd.source_date) desc)
                            order by  tsd.source_date) x
                      where date between ? and ?`,
                values
            };

        }
    }

};
