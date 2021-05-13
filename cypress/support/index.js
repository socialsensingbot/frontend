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

// require('cypress-plugin-retries');

// Cypress.on("window:before:load", win => {
//     win.indexedDB.deleteDatabase("ngForage");
// });
export const MAP_URL = "http://localhost:4200/map/uk-flood-live"


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

Cypress.on('uncaught:exception', (err, runnable,promise) => {
  // returning false here prevents Cypress from
  // failing the test
  console.error(err);
  console.error(promise);
  if (err && err.message) {
    console.error(err.message);
  }
  return false;
})
