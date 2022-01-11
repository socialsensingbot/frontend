// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import 'cypress-plugin-snapshots/commands';

// require('cypress-plugin-retries');

// Cypress.on("window:before:load", win => {
//     win.indexedDB.deleteDatabase("ngForage");
// });
export const MAP_URL = "http://localhost:4200/map/uk-flood-test"
export const ANALYTICS_URL = "http://localhost:4200/map/uk-flood-test/analytics"
export const DASHBOARD_URL = "http://localhost:4200/map/uk-flood-test/dashboard"
export const MAX_DATE = "16-Sept-21";
export const TS_SELECTED_MIN_DATE = "14-Sept-21";
export const TS_SELECTED_MIN_TIME = "01 am";
export const MIN_DATE = "11-Sept-21";
export const MIN_DATE_MILLIS = 1631577600000;
export const MAX_DATE_MILLIS = 1631664000000;
export const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
export const LONDON_URL = MAP_URL + "?selected=greater%20london&zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county";
export const LONDON_TWEET = ".app-twitter-id-1437925044643155976";
export const LONDON_TWEET_MENU = LONDON_TWEET + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const LONDON_TWEET_VISIBLE = LONDON_TWEET + ".atr-visible";
export const LONDON_TWEET_VISIBLE_MENU = LONDON_TWEET_VISIBLE + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const LONDON_TWEET_HIDDEN = LONDON_TWEET + ".atr-hidden";
export const LONDON_TWEET_HIDDEN_MENU = LONDON_TWEET_HIDDEN + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";

// https://github.com/cypress-io/cypress/issues/8525
afterEach(() => {
    cy.window().then(win => {
        // window.gc is enabled with --js-flags=--expose-gc chrome flag
        if (typeof win.gc === 'function') {
            // run gc multiple times in an attempt to force a major GC between tests
            win.gc();
            win.gc();
            win.gc();
            win.gc();
            win.gc();
        }
    });
});

Cypress.on('uncaught:exception', (err, runnable, promise) => {
    // returning false here prevents Cypress from
    // failing the test
    console.error(err);
    console.error(promise);
    if (err && err.message) {
        console.error(err.message);
    }
    return false;
})
