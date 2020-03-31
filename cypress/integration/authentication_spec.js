describe('Authentication:', function() {
  // Step 1: setup the application state
  beforeEach(function() {
    cy.visit('http://localhost:4200/map');
  });

  describe('Sign In:', () => {
    it('allows a user to signin', () => {

      //Login
      cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
      cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
      cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();

      //Logout
      cy.get('#logout').click();

      //Wax off
      cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
      cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
      cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();

    });
  });

});
