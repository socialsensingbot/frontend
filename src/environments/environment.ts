/* tslint:disable:object-literal-key-quotes */
// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {Dashboard} from "../app/pref/dashboard.service";
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import "zone.js/dist/zone-error"; // Included with Angular CLI.
import {SSLayerConfiguration} from "../app/types";

const defaultDashboard: Dashboard = {
    boards: [{
        deviceType: "all",
        pages:      [{
            title: "First Page",
            cards: []
        }]
    }]
};

const layers: SSLayerConfiguration = {
    "available": [
        {
            "id":          "flood",
            "title":       "Floods",
            "sources":     ["twitter"],
            "hazards":     ["flood"],
            "warnings":    "exclude",
            "annotations": ["source", "impact"],
            "icons":       ["flood"]
        },
        {
            "id":          "flood-with-warnings",
            "title":       "Floods (includes warnings)",
            "sources":     ["twitter"],
            "hazards":     ["flood"],
            "warnings":    "include",
            "annotations": ["source", "impact"],
            "icons":       ["flood", "storm-warning"]

        },
        {
            "id":          "flood-warnings-only",
            "title":       "Floods (only warnings)",
            "sources":     ["twitter"],
            "hazards":     ["flood"],
            "warnings":    "only",
            "annotations": ["source", "impact"],
            "icons":       ["storm-warning"]
        },
        {
            "id":          "wind",
            "title":       "Wind",
            "sources":     ["twitter"],
            "hazards":     ["wind"],
            "warnings":    "exclude",
            "annotations": ["impact"],
            "icons":       ["strong-wind"]

        },
        {
            "id":          "wind-and-flood",
            "title":       "Wind & Flood",
            "sources":     ["twitter"],
            "hazards":     ["wind", "flood"],
            "warnings":    "exclude",
            "annotations": ["source", "impact"],
            "icons":       ["flood", "strong-wind"]
        },
        {
            "id":          "snow",
            "title":       "Snow",
            "sources":     ["twitter"],
            "hazards":     ["snow"],
            "warnings":    "exclude",
            "annotations": ["impact"],
            "icons":       ["snow"]
        },

    ],
    "defaultLayer": "flood"
};

export const environment = {
    name:             "dev",
    lamdaEnvironment: "dev",
    version:          "dev",
    demo:             false,
    production:       false,
    hmr:              false,
    rollbar:          false,
    toolbarColor:     "primary",
    timezone:         Intl.DateTimeFormat().resolvedOptions().timeZone,
    // timezone:         "UTC",
    multipleSessions: true, // Can the user be logged into multiple devices/browsers at once?
    maxUsers:         -1, // can be -1 (no limit), 0 - no logins, 1 - single user at a time, n - n concurrent users.
    locale:           "en-GB",
    confirm:          {
        email:    "",
        password: ""
    },
    annotations:      [
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

    // features: ["impact", "source", "map"],
    features: ["impact", "source", "map", "dashboard", "analytics", "display"],

    showErrors:                          false,
    showLoadingMessages:                 true,
    mostRecentDateIsNow:                 true,
    sanitizeForGDPR:                     true,
    continuousUpdateThresholdInMinutes:  5,
    animateOnTimeSliderChange:           false,
    recentTweetHighlightOffsetInSeconds: 1200,
    defaultDataSet:                      "uk-flood-live",
    defaultPublicDisplayScript:          "default_script",
    availableDataSets:                   ["*"], // A list of datasets that will appear in the toolbar dropdown, or "*" for all.
    cacheProcessedTweets:                false,
    mapTileUrlTemplate:                  "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg",
    defaultDashboard,
    layers:                              layers,
    blinkRateInMilliseconds:             1000,
    // mapTileUrlTemplate:
    // "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"
    shareTextAutocompleteInGroup: true,
    useRestMapData:               true,
    maxCallsPerMinute:            10000,
    analyticsDefaultRegions:      ["uk"],
    tweetCSVExportFormat:         "default",
    showAnalyticsSideMenu:        false,
    countryDownloadRegionType:    "bi_country",
    exceedanceThreshold:          100,
    countThreshold:               0,
    publicDisplayTweetScroll:     "all",
    publicDisplayTweetScrollRate: 3000,
    publicDisplayMaxTweets:       200

};
