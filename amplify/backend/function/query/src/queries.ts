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
                sql: `SELECT sum(message_count) as count,
                             aggregate_date     as date,
                             avg(exceedence)    as exceedence,
                             'all'              as region
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
                // todo - broken see next query
                sql: `SELECT message_count as count, aggregate_date as date, exceedence, region
                      FROM aggregate_counts_by_region
                      WHERE source = ?
                        and hazard = ?
                        and aggregate_date between ? and ?

                        and region in (select region from ref_region_groups where parent in (?) or region in (?))
                      order by aggregate_date`,
                values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                         params.regions,
                         params.regions]
            };
        }
    },
    count_by_date_for_regions_and_fulltext: (params: any) => {
        let fullText = "";
        if (typeof params.textSearch !== "undefined" && params.textSearch.length > 0) {
            fullText = " and MATCH (source_text) AGAINST(? IN BOOLEAN MODE) ";
        }
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            const values = fullText ? [params.source, params.hazard, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.source, params.hazard,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)];
            return {
                sql: `select *
                      from (SELECT count(*)                                                             as count,
                                   source_date                                                          as date,
                                   'all'                                                                as region,
                                   (select count(*) from (select * from text_by_region group by source_date) x)  / (rank() OVER w) 
                                           as exceedence
                            FROM text_by_region
                            WHERE source = ?
                              and hazard = ? ${fullText}
                            group by source_date
                                WINDOW w AS (ORDER BY COUNT (source_date) desc)
                            order by source_date) x
                      where date between ? and ? `,
                values
            };
        } else {
            const values = fullText ? [params.source, params.hazard,
                                       params.regions, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.source, params.hazard,
                                                                     params.regions,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)];
            return {
                sql: `select *
                      from (SELECT count(source_date)                                                   as count,
                                   source_date                                                          as date,
                                   parent                                                               as region,
                                   (select count(*) from (select * from text_by_region group by source_date) x)  / (rank() OVER w)
                                       as exceedence
                            FROM text_by_region tbr,
                                 ref_region_groups as rrg
                            WHERE tbr.source = ?
                              and tbr.hazard = ?
                              and tbr.region_1 = rrg.region
                              and rrg.parent in (?)
                                ${fullText}
                            group by source_date, rrg.parent
                                WINDOW w AS (ORDER BY COUNT (source_date) desc)
                            order by source_date) x
                      where date between ? and ?`,
                values
            };

        }
    },
    count_by_date_for_all_regions:          (params: any) => {

        return {
            sql: `SELECT sum(message_count) as count,
                         aggregate_date     as date,
                         avg(exceedence)    as exceedence,
                         'all'              as region
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

