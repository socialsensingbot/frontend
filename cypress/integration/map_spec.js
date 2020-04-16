describe('Map: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.login();
    cy.wait(2000);
  });

  describe('Interact', () => {
    it('with the map', () => {
      // Step 2: Take an action (Sign in)
      cy.get('.content-inner').click();
      cy.get('.map').click();
      cy.get('#logout').click();
      // cy.get('.leaflet-interactive:nth-child(174)').click();

    });
  });

  describe('Choose count', () => {
    const url = "http://localhost:4200/map?active_number=count";
    it('and check legend', () => {
      cy.visit(url);
      cy.wait(10000);
      cy.url().should("equal", url);
      cy.get("mat-sidenav-content > map-legend > mat-card > div > span:nth-child(1) > i").should("have.attr","style").should("eq","background: rgb(43, 140, 190);")
      cy.get("mat-sidenav-content > map-legend > mat-card > div > span:nth-child(1)").should("have.text"," 150–50 ");
    });
  });



});
