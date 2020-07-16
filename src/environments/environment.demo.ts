export const environment = {
  production:       true,
  name:             "demo",
  version:          "demo",
  demo:             true,
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:         "UTC",
  locale:           "en-GB",
  rollbar:          true,
  multipleSessions: true,
  hmr:              false,
  confirm:          {
    email:    "",
    password: ""
  },
  showErrors:       false,
  showLoadingMessages: true,
  sanitizeForGDPR: true,
  defaultDataSet: "live",
  availableDataSets: ["*"]
};
