// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  name:                 "dev",
  version:              "dev",
  demo:                 false,
  production:           false,
  hmr:                  false,
  rollbar:              false,
  toolbarColor:         "primary",
  // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:             "UTC",
  multipleSessions:     true, //Can the user be logged into multiple devices/browsers at once?
  maxUsers:             1, // can be -1 (no limit), 0 - no logins, 1 - single user at a time, n - n concurrent users.
  locale:               "en-GB",
  confirm:              {
    email:    "",
    password: ""
  },
  showErrors:           false,
  showLoadingMessages:  true,
  sanitizeForGDPR:      true,
  defaultDataSet:       "live",
  availableDataSets:    ["*"], // A list of datasets that will appear in the toolbar dropdown, or "*" for all.
  cacheProcessedTweets: false,
  mapTileUrlTemplate:   "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"
  // mapTileUrlTemplate:   "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import "zone.js/dist/zone-error"; // Included with Angular CLI.
