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
export const TS_SELECTED_MIN_TIME = "00 am";
export const MIN_DATE = "11-Sept-21";
export const MAX_DATE_MILLIS = 1631664000000;
export const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;
export const MIN_DATE_MILLIS = MAX_DATE_MILLIS - ONE_DAY_MILLIS;
export const LONDON_URL = MAP_URL + "?selected=greater%20london&zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county";
export const LONDON_TWEET = ".app-twitter-id-1437925044643155976";
export const LONDON_TWEET_MENU = LONDON_TWEET + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const LONDON_TWEET_VISIBLE = LONDON_TWEET + ".atr-visible";
export const LONDON_TWEET_VISIBLE_MENU = LONDON_TWEET_VISIBLE + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const LONDON_TWEET_HIDDEN = LONDON_TWEET + ".atr-hidden";
export const LONDON_TWEET_HIDDEN_MENU = LONDON_TWEET_HIDDEN + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const POWYS_URL = MAP_URL + "?selected=powys&zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county";
export const POWYS_TWEET = ".app-twitter-id-1437862691239079939";
export const POWYS_TWEET_MENU = POWYS_TWEET + " > .app-tweet-item-card-surround > .app-tweet-item-menu  button";
export const POWYS_TWEET_VISIBLE = POWYS_TWEET + ".atr-visible";
export const POWYS_TWEET_VISIBLE_MENU = POWYS_TWEET_VISIBLE + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";
export const POWYS_TWEET_HIDDEN = POWYS_TWEET + ".atr-hidden";
export const POWYS_TWEET_HIDDEN_MENU = POWYS_TWEET_HIDDEN + " > .app-tweet-item-card-surround > .app-tweet-item-menu > .mat-focus-indicator > .mat-button-wrapper > .mat-icon";

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
        // cy.get('@consoleError').should('not.be.called')
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


export const testUnhide = (refresh, count, fail) => {
    cy.log("Un-ignoring " + count);

    const tweetHidden = ".atr-0.atr-hidden";
    cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
    cy.get(".app-tweet-drawer", {timeout: 30000}).then(drawer => {
        if (!fail && drawer.find(tweetHidden).length === 0) {
            cy.log("Skipping non existent tweet");
        } else {
            cy.get(tweetHidden).scrollIntoView().should('be.visible');
            cy.unignoreTweet(tweetHidden);
            cy.wait(1000);
        }
    })
};

export const testHide = (refresh, count) => {

    cy.log("Ignoring");
    const tweetVisible = `.atr-visible .app-tweet-item`;
    cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
    cy.clickTweetTab(1);
    cy.get(tweetVisible, {timeout: 60000})
        .then(t => {
            const index = t.first().parents(".atr-visible").attr("data-index");
            cy.get(`.atr-visible.atr-${index}`, {timeout: 60000}).scrollIntoView().should('be.visible');
            cy.ignoreTweet(`.atr-visible.atr-${index}`);
            cy.wait(1000);
        });


};

require('cypress-terminal-report/src/installLogsCollector')({
                                                                collectTypes: ['cons:info', 'cons:warn', 'cons:error', 'cy:log', 'cy:xhr', 'cy:request', 'cy:route', 'cy:intercept', 'cy:command']
                                                            });
