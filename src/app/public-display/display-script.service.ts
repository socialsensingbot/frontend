import {Injectable} from '@angular/core';
import {DisplayScript} from "./types";

export const DAY = 24 * 60 * 60 * 1000;
export const HOUR = 60 * 60 * 1000;

@Injectable({
                providedIn: 'root'
            })
export class DisplayScriptService {

    constructor() {
    }

    private _scripts: { [key: string]: DisplayScript } = {
        county_ex_range_4d_step_3h_win_24h: {
            screens: [
                {
                    type:                       "map-by-date",
                    data:                       {
                        layerId:    "flood",
                        regionType: "county",
                        statistic:  "exceedance"
                    }, animation:               {
                        type:                         "date-animation",
                        startTimeOffsetMilliseconds:  7 * DAY,
                        endTimeOffsetMilliseconds:    0,
                        windowDurationInMilliseconds: DAY,
                        stepDurationInMilliseconds:   3 * HOUR,

                    },
                    location:                   {
                        lon:               -6,
                        lat:               54,
                        zoom:              6.5,
                        animationDuration: 1000,
                    },
                    stepDurationInMilliseconds: 1500,
                    animationLoops:             10


                }
            ]
        },
        county_ex_range_24h_step_1h_win_6h: {
            screens: [
                {
                    type:                       "map-by-date",
                    data:                       {
                        layerId:    "flood",
                        regionType: "county",
                        statistic:  "exceedance"
                    }, animation:               {
                        type:                         "date-animation",
                        startTimeOffsetMilliseconds:  DAY,
                        endTimeOffsetMilliseconds:    0,
                        windowDurationInMilliseconds: 6 * HOUR,
                        stepDurationInMilliseconds:   1 * HOUR,


                    },
                    location:                   {
                        lon:               -6,
                        lat:               54,
                        zoom:              6.5,
                        animationDuration: 1000,
                    },
                    stepDurationInMilliseconds: 1500,
                    animationLoops:             10


                }
            ]
        },
        combi_example:                      {
            screens: [
                {
                    type:                       "map-by-date",
                    data:                       {
                        layerId:    "flood",
                        regionType: "coarse",
                        statistic:  "count"
                    }, animation:               {
                        type:                         "date-animation",
                        startTimeOffsetMilliseconds:  7 * DAY,
                        endTimeOffsetMilliseconds:    0,
                        windowDurationInMilliseconds: DAY,
                        stepDurationInMilliseconds:   DAY,

                    },
                    location: {
                        lon:               -7.6,
                        lat:               53.5,
                        zoom:              8,
                        animationDuration: 1500,
                    },
                    stepDurationInMilliseconds: 1500,
                    animationLoops:             1
                },
                {
                    type:                       "map-by-date",
                    data:                       {
                        layerId:    "flood",
                        regionType: "county",
                        statistic:  "exceedance"
                    }, animation:               {
                        type:                         "date-animation",
                        startTimeOffsetMilliseconds:  DAY,
                        endTimeOffsetMilliseconds:    0,
                        windowDurationInMilliseconds: 6 * HOUR,
                        stepDurationInMilliseconds:   3 * HOUR,


                    },
                    location: {
                        lon:               -6,
                        lat:               54,
                        zoom:              6,
                        animationDuration: 1500,
                    },
                    stepDurationInMilliseconds: 1500,
                    animationLoops:             1


                },

            ]
        },
    }

    public script(id: string): DisplayScript {
        return this._scripts[id];
    }
}
