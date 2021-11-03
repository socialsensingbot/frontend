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
            "annotations": ["source", "impact"]
        }
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
    name:             "production",
    lamdaEnvironment: "prod",
    demo:             false,
    version:          "2.4",
    // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezone:             "UTC",
    locale:               "en-GB",
    toolbarColor:         "warn",
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
    annotations:          [
        {
            name:  "impact",
            title: "Impact",
            // The ability to tag tweets with an impact annotation
            options: [
                {title: "1 – Minimal", value: "minimal", color: "#43A047"},
                {title: "2 – Minor", value: "minor", color: "#FFEE58"},
                {title: "3 - Significant", value: "significant", color: "#FFB300"},
                {title: "4 - Severe", value: "severe", color: "#F4511E"}
            ]
        },
        {
            name:  "source",
            title: "Source",
            // The ability to tag tweets with a source
            options: [
                {title: "River", value: "river", color: "#43A047"},
                {title: "Surface", value: "surface", color: "#FFEE58"},
                {title: "Groundwater", value: "groundwater", color: "#FFB300"},
                {title: "Coastal", value: "coastal", color: "#F4511E"}
            ]
        },
    ],

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
    analyticsDefaultRegions:      ["uk"],
    maxCallsPerMinute:            10000,

};
