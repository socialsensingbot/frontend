describe.only('URL State: ', function () {

  describe('select county', () => {
    it('when unauthorized and preserve state', () => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.wait(10000);
      cy.url().should("equal", "http://localhost:4200/map?selected=powys");
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });
  });

  describe('select county', () => {
    it('when authorized and preserve state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.wait(10000);
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.url().should("equal", "http://localhost:4200/map?selected=powys");
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });
  });

  describe.only('select county and date range', () => {
    it('when authorized and preserve state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.wait(10000);
      cy.visit("http://localhost:4200/map?selected=powys&min_offset=-5459&max_offset=-2819");
      cy.url().should("equal", "http://localhost:4200/map?selected=powys&min_offset=-5459&max_offset=-2819");
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time .slider-date").should("contain.text","11-Oct-18");
      cy.get(".slider-date-time .slider-time").should("contain.text","05 AM");
      cy.get(".tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.get("twitter-panel .tweets-header  mat-card > span > b", {timeout: 40000}).should("contain.text","Showing 8 of 8 Tweets from Powys");
      cy.logout();
    });
  });

});
