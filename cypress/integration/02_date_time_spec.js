describe('Date time: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-long");
    cy.login();
  });

  describe('select county and date range', () => {
    console.debug("Tests https://github.com/socialsensingbot/frontend/issues/67");
    const url = "http://localhost:4200/map?selected=west%20sussex&min_offset=-659&max_offset=-179&zoom=5";
    it('with no tweets', () => {
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.url().should("equal", url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text","27-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text","06 PM");
      cy.get(".tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.url().should("equal", url);
      cy.twitterPanelHeader("No Tweets from West Sussex");

      cy.logout();
    });
  });



});