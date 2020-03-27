describe('Authenticator:', function() {
  // Step 1: setup the application state
  beforeEach(function() {
    cy.visit('http://localhost:4200/map');
  });

  describe('Sign In:', () => {
    it('allows a user to signin', () => {
      // Step 2: Take an action (Sign in)
      cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
      cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
      cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();

      // Step 3: Make an assertion (Check for sign-out text)
      cy.get('#logout');
    });
  });

});
