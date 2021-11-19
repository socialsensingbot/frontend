import {StatisticType} from "../analytics/timeseries";

export interface DisplayScript {
    screens: DisplayScreen[];
}

export interface DisplayScreen {
    type: "map-by-date";
    location: AnimationLocation;
    data: AnimationScreenData;
    animation: DateAnimation;
    stepDurationInMilliseconds: number;
    animationSteps: number;
    animationLoops: number;
}


export interface DateAnimation {
    type: "date-animation";
    startTimeOffsetMilliseconds: number;
    endTimeOffsetMilliseconds: number;
}

export interface LocationAnimation {
    type: "location-animation";
    startLocation: AnimationLocation;
    endLocation: AnimationLocation;
}

export interface AnimationScreenData {
    layerId: string;
    statistic: StatisticType;
    regionType: string;

}

export interface AnimationLocation {
    lat: number;
    lon: number;
    zoom: number;
    animationDuration: number;

}
