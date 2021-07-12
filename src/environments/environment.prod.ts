import {Dashboard} from "../app/pref/dashboard.service";

const defaultDashboard: Dashboard = {
    boards: [{
        deviceType: "all",
        pages:      [{
            title: "First Page",
            cards: [
                {title:    "Count By Text and Region",
                    cols:  2,
                    rows:  2,
                    type:  "timeseries-text-and-region",
                    state: {},
                    id:    1
                },
                {title: "Total Count", cols: 1, rows: 1, type: "timeseries-total", state: {}, id: 2},
                // {title: "Exceedence by Date", cols: 1, rows: 1, type: "timeseries-exceed", state: {}},
                // {title: "Exceedence by Region", cols: 2, rows: 1, type: "timeseries-exceed-region", state: {}},
            ]
        }]
    }]
};

export const environment = {
    production:       true,
    name:             "production",
    lamdaEnvironment: "prod",
    demo:             false,
    version:          "2.0",
    // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone:             "UTC",
    locale:               "en-GB",
    toolbarColor:         "primary",
    rollbar:              true,
    multipleSessions:     true,
    maxUsers:             -1,
    hmr:                  false,
    showErrors:           false,
    showLoadingMessages:  true,
    sanitizeForGDPR:      true,
    confirm:              {
        email:    "",
        password: ""
    },
    defaultDataSet:       "live",
    availableDataSets:    ["*"],
    cacheProcessedTweets: false,

    impact: {
        //The ability to tag tweets with an impact annotation
        levels: [
            {title: "1 – Minimal", value: "minimal", color: "#43A047"},
            {title: "2 – Minor", value: "minor", color: "#FFEE58"},
            {title: "3 - Significant", value: "significant", color: "#FFB300"},
            {title: "4 - Severe", value: "severe", color: "#F4511E"}
        ]
    },
    source: {
        //The ability to tag tweets with a source
        types: [
            {title: "River", value: "river", color: "#43A047"},
            {title: "Surface", value: "surface", color: "#FFEE58"},
            {title: "Groundwater", value: "groundwater", color: "#FFB300"},
            {title: "Coastal", value: "coastal", color: "#F4511E"}
        ]
    },

    features:                            ["impact", "source"],
    mostRecentDateIsNow:                 true,
    continuousUpdateThresholdInMinutes:  90,
    animateOnTimeSliderChange:           false,
    recentTweetHighlightOffsetInSeconds: 1200,

    mapTileUrlTemplate:      "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg",
    blinkRateInMilliseconds: 1000,
    defaultDashboard,
    newExceedenceCalc: false

};
