export const environment = {
  production:       true,
  name:             "demo",
  version:          "demo",
  demo:             true,
  // timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
  timezone:         "UTC",
  locale:           'en-GB',
  rollbar:          true,
  multipleSessions: false,
  hmr:              false,
  confirm:          {
    email:    '',
    password: ''
  }
};
