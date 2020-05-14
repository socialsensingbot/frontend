// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

const LONG_TIMEOUT = 60000;

Cypress.Commands.add("login", () => {
  //Login
  cy.url({timeout: LONG_TIMEOUT}).should("contain", "auth/signin")
  cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
  cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
  cy.get('.mat-button-base.mat-raised-button').contains('Sign In');
  cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();
  cy.url({timeout: LONG_TIMEOUT}).should("not.contain", "auth/signin")
});

Cypress.Commands.add("logout", () => {
  cy.get('#logout').click();
});

Cypress.Commands.add("visitAndWait", (url) => {
  cy.visit(url);
  cy.url().should("equal", url);
  cy.noSpinner();
});


Cypress.Commands.add("noSpinner", () => {
  cy.get('.map');
  cy.get("mat-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.get('body').should(el => {
    if (el) {
      if (el.find("mat-spinner").length > 0) {
        cy.get("mat-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
      } else {
      }
    } else {
    }
  });
});

Cypress.Commands.add("twitterPanelHeader", (text) => {
  cy.get("twitter-panel .tweets-header", {timeout: LONG_TIMEOUT});
  cy.get(".tinfo-spinner").should("not.be.visible");
  cy.get("twitter-panel .tweets-header  mat-card > span > b", {timeout: LONG_TIMEOUT}).should("contain.text", text);
});
Cypress.Commands.add("twitterPanelVisible", () => {
  cy.get(".tweet-drawer", {timeout: LONG_TIMEOUT}).should("be.visible");
});

Cypress.Commands.add("twitterPanelNotVisible", () => {
  cy.get(".tweet-drawer", {timeout: LONG_TIMEOUT}).should("not.be.visible");
});Cypress.Commands.add("pushStateDelay", () => {
  cy.wait(500);
});
Cypress.Commands.add("stubLiveJson", (file) => {
  // Alternatively you can use CommonJS syntax:
// require('./commands')
// sets up cy.server, so cypress knows to
// prepare network responses
  cy.server();
// this is where we tell cypress to intercept
// certain XHR calls,
// and to stub in our fixture instead
  cy.route({
             // our example is a GET call, but you could also
             // have a POST, if you're pushing data up
             method: "GET",
             // more on the URL below
             url: /.*\/public\/live.json?.*/g,
             // the fixture: shortcut will know to
             // look in cypress/fixtures,
             // unless you configure cypress to
             // put it somewhere else
             response: "fixture:"+file+".json"
           });

});
