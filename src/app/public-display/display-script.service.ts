import {Injectable} from '@angular/core';
import {DisplayScript} from "./types";
import {ONE_DAY} from "../map/data/map-data";

@Injectable({
                providedIn: 'root'
            })
export class DisplayScriptService {

    constructor() {
    }

    public script(id: string): DisplayScript {
        return {
            screens: [
                {
                    type:                       "map-by-date",
                    data:                       {
                        layerId:    "flood",
                        regionType: "county",
                        statistic:  "exceedance"
                    }, animation:               {
                        type:                        "date-animation",
                        startTimeOffsetMilliseconds: ONE_DAY,
                        endTimeOffsetMilliseconds:   0,


                    },
                    location:                   {
                        lon:               -0.2,
                        lat:               52,
                        zoom:              7,
                        animationDuration: 1000,
                    },
                    animationSteps:             12,
                    stepDurationInMilliseconds: 2000,
                    animationLoops:             10


                }
            ]
        }
    }
}
