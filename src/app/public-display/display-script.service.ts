import {Injectable} from '@angular/core';
import {DisplayScript} from "./types";

export const DAY = 24 * 60 * 60 * 1000;
export const HOUR = 60 * 60 * 1000;

@Injectable({
                providedIn: 'root'
            })
export class DisplayScriptService {

    private _scripts: DisplayScript[] = [{
        id:      "default_script",
        title:   "Current Map View",
        screens: [
            {
                title:                      "",
                type:                       "map-by-date",
                data:                       {}, animation: {
                    type:                         "date-animation",
                    startTimeOffsetMilliseconds:  DAY,
                    endTimeOffsetMilliseconds:    0,
                    windowDurationInMilliseconds: 6 * HOUR,
                    stepDurationInMilliseconds:   1 * HOUR,


                },
                stepDurationInMilliseconds: 1500,
                animationLoops:             10


            }
        ]
    }
        , {
            id:      "county_ex_range_4d_step_3h_win_24h",
            title:   "UK County, Flood, Exceedance - Last 4 days",
            screens: [
                {

                    type:                       "map-by-date",
                    title:                      "UK Last 4 Days",
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
                                         {
                                             id:      "county_ex_range_24h_step_1h_win_6h",
                                             title:   "UK County, Flood, Exceedance - Last 24 Hours",
                                             screens: [
                                                 {
                                                     title:                      "UK Last 24 Hours",
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
                                         {
                                             id:      "combi_example",
                                             title:   "Example Combined Script",
                                             screens: [
                                                 {
                                                     type:                       "map-by-date",
                                                     title:                      "Eire Tweets, Coarse Grid, Last Week",
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
                                                     location:                   {
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
                                                     title:                      "UK Flood Last 24 Hours",
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
                                                     location:                   {
                                                         lon:               -6,
                                                         lat:               54,
                                                         zoom:              6,
                                                         animationDuration: 1500,
                                                     },
                                                     stepDurationInMilliseconds: 1500,
                                                     animationLoops:             1


                                                 },
                                                 {
                                                     type:                       "map-by-date",
                                                     title:                      "UK Snow Last 24 Hours",
                                                     data:                       {
                                                         layerId:    "snow",
                                                         regionType: "county",
                                                         statistic:  "exceedance"
                                                     }, animation:               {
                                                         type:                         "date-animation",
                                                         startTimeOffsetMilliseconds:  DAY,
                                                         endTimeOffsetMilliseconds:    0,
                                                         windowDurationInMilliseconds: 6 * HOUR,
                                                         stepDurationInMilliseconds:   3 * HOUR,


                                                     },
                                                     location:                   {
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
    ];

    constructor() {
    }

    public get all(): DisplayScript[] {
        return this._scripts.filter(i => i.id !== "default_script");
    }

    public script(id: string): DisplayScript {
        return this._scripts.filter(i => i.id === id)[0];
    }
}
