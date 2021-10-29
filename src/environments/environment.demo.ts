/* tslint:disable:object-literal-key-quotes */
import {Dashboard} from "../app/pref/dashboard.service";
import {SSLayerConfiguration} from "../app/types";


const layers: SSLayerConfiguration = {
    "available":    [
        {
            "id":       "flood",
            "title":    "Floods",
            "sources":  ["twitter"],
            "hazards":  ["flood"],
            "warnings": "exclude",
        },
        {
            "id":       "flood-with-warnings",
            "title":    "Floods (includes warnings)",
            "sources":  ["twitter"],
            "hazards":  ["flood"],
            "warnings": "include"
        },
        {
            "id":       "flood-warnings-only",
            "title":    "Floods (only warnings)",
            "sources":  ["twitter"],
            "hazards":  ["flood"],
            "warnings": "only"
        },
        {
            "id":       "wind",
            "title":    "Wind",
            "sources":  ["twitter"],
            "hazards":  ["wind"],
            "warnings": "exclude"
        },
        {
            "id":       "wind-and-flood",
            "title":    "Wind & Flood",
            "sources":  ["twitter"],
            "hazards":  ["wind", "flood"],
            "warnings": "exclude"
        },
        {
            "id":       "snow",
            "title":    "Snow",
            "sources":  ["twitter"],
            "hazards":  ["snow"],
            "warnings": "exclude"
        },

    ],
    "defaultLayer": "flood"
};

const defaultDashboard: Dashboard = {
    boards: [{
        deviceType: "all",
        pages:      [{
            title: "First Page",
            cards: []
        }]
    }]
};

export const environment = {
    production:       true,
    name:             "demo",
    lamdaEnvironment: "demo",
    demo:             true,
    version:          "2.4-demo",
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
    defaultDataSet:       "uk-flood-live",
    availableDataSets:    ["uk-flood-live"],
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

    features:                            ["impact", "source", "map", "dashboard", "analytics"],
    mostRecentDateIsNow:                 true,
    continuousUpdateThresholdInMinutes:  90,
    animateOnTimeSliderChange:           false,
    recentTweetHighlightOffsetInSeconds: 1200,

    mapTileUrlTemplate:           "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg",
    blinkRateInMilliseconds:      1000,
    defaultDashboard,
    layers:                       layers,
    shareTextAutocompleteInGroup: true,
    analyticsDefaultRegions:      ["ireland"],
    maxCallsPerMinute:            600,

};
