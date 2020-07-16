export const environment = {
  production:        true,
  name:              "production",
  demo:              false,
  version:           "1.3.2",
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:          "UTC",
  locale:            "en-GB",
  toolbarColor:      "primary",
  rollbar:           true,
  multipleSessions:  false,
  hmr:               false,
  showErrors:        false,
  sanitizeForGDPR:   true,
  confirm:           {
    email:    "",
    password: ""
  },
  defaultDataSet:    "live",
  availableDataSets: ["*"]

};
