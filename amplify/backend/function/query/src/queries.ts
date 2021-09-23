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
                                   source_date as date,
                                   'all'       as region,  1.0 / (cume_dist()  OVER w) as exceedance 
                            FROM live_text
                            WHERE source IN (?)
                              and hazard IN (?) ${fullText}
                            group by source_date
                                WINDOW w AS (ORDER BY COUNT(source_date) desc)
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
                      from (SELECT count(t.source_date) as count,
                                   t.source_date       as date,
                                   parent             as region,  
                                   1.0 / (cume_dist()  OVER w) as exceedance 
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
                            group by  t.source_date, rrg.parent
                                WINDOW w AS (ORDER BY COUNT ( t.source_date) desc)
                            order by  t.source_date) x
                      where date between ? and ?`,
                values
            };

        }
    }

};
