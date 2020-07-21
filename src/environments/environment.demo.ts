export const environment = {
  production:           true,
  name:                 "demo",
  version:              "demo",
  demo:                 true,
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:             "UTC",
  locale:               "en-GB",
  rollbar:              true,
  multipleSessions:     true,
  hmr:                  false,
  confirm:              {
    email:    "",
    password: ""
  },
  showErrors:           false,
  showLoadingMessages:  true,
  sanitizeForGDPR:      true,
  defaultDataSet:       "live",
  availableDataSets:    ["*"],
  cacheProcessedTweets: false,
  // mapTileUrlTemplate:   "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"
  mapTileUrlTemplate:   "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"
};
