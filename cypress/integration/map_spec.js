describe('Map: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
  });

  describe('Interact', () => {
    it('with the map', () => {
      // Step 2: Take an action (Sign in)
      cy.login();
      cy.get('.content-inner').click();
      cy.get('.map').click();
      cy.get('#logout').click();
      // cy.get('.leaflet-interactive:nth-child(174)').click();

    });
  });


});
