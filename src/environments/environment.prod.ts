export const environment = {
  production:           true,
  name:                 "production",
  demo:                 false,
  version: "1.4.1",
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

};
