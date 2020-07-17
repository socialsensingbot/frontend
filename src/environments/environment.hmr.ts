export const environment = {
  version:              "hmr",
  production:           false,
  hmr:                  true,
  demo:                 false,
  rollbar:              false,
  toolbarColor:         "primary",
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:             "UTC",
  multipleSessions:     true,
  locale:               "en-GB",
  confirm:              {
    email:    "",
    password: ""
  },
  showErrors:           false,
  sanitizeForGDPR:      true,
  defaultDataSet:       "live",
  availableDataSets:    ["live"],
  cacheProcessedTweets: false
};
