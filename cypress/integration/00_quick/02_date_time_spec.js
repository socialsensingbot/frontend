describe('Date time: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.login();
  });

  describe('select county and date range', () => {
    console.debug("Tests https://github.com/socialsensingbot/frontend/issues/67");
    const url = "http://localhost:4200/map?selected=scottish%20borders&min_offset=-1439&max_offset=0&zoom=5&abs_time=1539561540000";
    it('with no tweets', () => {
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "15-Oct-18");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "1 AM");
      cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
      cy.url().should("equal", url);
      cy.twitterPanelHeader("No Tweets from Scottish Borders");

      cy.logout();
    });
  });



});
