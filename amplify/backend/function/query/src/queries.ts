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
        const exceedance =
            "(select count(*) from (select distinct date(source_date) from live_text) x) / (rank() OVER w) as exceedance, "
            + "1.0 / (percent_rank()  OVER w) as inv_percent ";
        if (typeof params.textSearch !== "undefined" && params.textSearch.length > 0) {
            fullText = " and MATCH (t.source_text) AGAINST(? IN BOOLEAN MODE) ";
        }
        if (!params.regions || (params.regions.includes("*") || params.regions.length === 0)) {
            const values = fullText ? [params.layer.sources, params.layer.hazards, params.textSearch, dateFromMillis(params.from),
                                       dateFromMillis(params.to)] : [params.layer.sources, params.layer.hazards,
                                                                     dateFromMillis(params.from),
                                                                     dateFromMillis(params.to)];
            return {
                sql: `select *
                      from (SELECT count(*) as count,
                                   DATE(source_date) as date,
                                   'all'       as region, ${exceedance}
                            FROM live_text
                            WHERE source IN (?)
                              and hazard IN (?) ${fullText}
                            group by DATE (source_date)
                                WINDOW w AS (ORDER BY COUNT (DATE (source_date)) desc)
                            order by source_date) x
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
                      from (SELECT count(DATE(vr.source_timestamp)) as count,
                                   DATE(vr.source_timestamp)        as date,
                                   parent             as region, ${exceedance}
                            FROM mat_view_regions vr, live_text t,
                                ref_region_groups as rrg
                            WHERE vr.source IN (?)
                              and vr.hazard IN (?)
                              and vr.region = rrg.region
                              and vr.region_type = 'county'
                              and t.source_id= vr.source_id
                              and t.source= vr.source
                              and t.hazard= vr.hazard
                              and rrg.parent IN (?) 
                              ${fullText}
                            group by DATE (vr.source_timestamp), rrg.parent
                                WINDOW w AS (ORDER BY COUNT (DATE (vr.source_timestamp)) desc)
                            order by DATE(vr.source_timestamp)) x
                      where date between ? and ?`,
                values
            };

        }
    }

};
