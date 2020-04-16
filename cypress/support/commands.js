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
Cypress.Commands.add("login", () => {
  //Login
  cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
  cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
  cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();
  cy.wait(2000);
});

Cypress.Commands.add("logout", () => {
  cy.get('#logout').click();
});

Cypress.Commands.add("noSpinner", () => {
  cy.wait(4000);
  cy.get('mat-spinner',{timeout:60000}).should("not.be.visible");
});

Cypress.Commands.add("twitterPanelHeader", (text) => {
  cy.get("twitter-panel .tweets-header  mat-card > span > b", {timeout: 60000}).should("contain.text",text);
});
