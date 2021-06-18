/*
 * © 2020 All rights reserved.
 */

import {QueryOptions} from "mysql";

const dateFromMillis = (time: number) => {
    const dateTime = new Date(time);
    return new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
};


export const queries: { [id: string]: (params) => QueryOptions } = {
    count_by_date: (params: any) => {
        return {
            sql: `SELECT count(source_date), source_date as date
                  FROM text_by_region_and_source
                  WHERE source = 'twitter'
                    and hazard = 'flood'
                    and source_date between ? and ?
                    and region_1 = ?
                  group by source_date
                  order by source_date`,
            values: [params.source, params.hazard, dateFromMillis(params.from), dateFromMillis(params.to),
                     params.region1]
        };
    }

};

