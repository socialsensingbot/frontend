describe('Map: ', function() {
  // Step 1: setup the application state
  beforeEach(function() {
    cy.visit('http://localhost:4200/map');
  });

  describe('Interact', () => {
    it('with the map', () => {
      // Step 2: Take an action (Sign in)
      cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
      cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
      cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();
      cy.get('.content-inner').click();
      cy.get('.map').click();
      cy.get('#logout').click();
      // cy.get('.leaflet-interactive:nth-child(174)').click();

    });
  });


});
