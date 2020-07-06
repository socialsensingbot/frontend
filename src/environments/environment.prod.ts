export const environment = {
  production:       true,
  name:             "production",
  demo:             false,
  version:          "1.2.1",
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
