describe('Infinite Scroll (https://github.com/socialsensingbot/frontend/issues/10): ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.server();
    cy.mockGraphQL();
    cy.login();
  });

  describe('simple scroll', () => {
    const url = "http://localhost:4200/map?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";

    it('top and bottom', () => {
      cy.visitAndWait(url);
      cy.twitterPanelHeader("from");
      cy.get(".atr-0.atr-visible", {timeout: 90000})
      cy.get(".atr-0.atr-visible").scrollIntoView()
      cy.get(".atr-0.atr-visible", {timeout: 90000}).should("be.visible");
      cy.get('.tweets-outer').scrollTo('bottom');
      cy.get(".atr-0", {timeout: 20000}).should("not.be.visible");
      cy.logout();
    });
  });


})
;
