export const environment = {
  production:           true,
  name:                 "production",
  demo:                 false,
  version:              "1.3.3",
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:             "UTC",
  locale:               "en-GB",
  toolbarColor:         "primary",
  rollbar:              true,
  multipleSessions:     false,
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
  // mapTileUrlTemplate:   "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"
  mapTileUrlTemplate:   "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"

};
