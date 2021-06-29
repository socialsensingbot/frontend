export const environment = {
  production:           true,
  name:                 "production",
  demo:                 false,
  version: "1.5.1",
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:             "UTC",
  locale:               "en-GB",
  toolbarColor:         "primary",
  rollbar:              true,
  multipleSessions:     true,
  maxUsers: -1,
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

  impact:               {
    //The ability to tag tweets with an impact annotation
    levels: [
      {title: "1 – Minimal", value: "minimal", color: "#43a047"},
      {title: "2 – Minor", value: "minor", color: "#ffee58"},
      {title: "3 - Significant", value: "significant", color: "#ffb300"},
      {title: "4 - Severe", value: "severe", color: "#f4511e"}
    ]
  },
  features:             ["impact"],
  mapTileUrlTemplate:   "https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicnVkeWFydGh1ciIsImEiOiJjamZrem1ic3owY3k4MnhuYWt2dGxmZmk5In0.ddp6_hNhs_n9MJMrlBwTVg"

};
