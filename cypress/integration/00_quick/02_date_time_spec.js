import {MAP_URL} from "../../support";

describe('02 Date time: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.login();
  });

  describe('select county and date range', () => {
    console.debug("Tests https://github.com/socialsensingbot/frontend/issues/67");
    const url = MAP_URL + "?selected=scottish%20borders&zoom=5&max_time=1539561540000&min_time=1539475200000&active_number=stats&active_polygon=county";
    it('with no tweets', () => {
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "15-Oct-18");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "0 am");
      cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
      cy.url().should("equal", url);
      cy.twitterPanelHeader("Scottish Borders", "No Tweets");
      cy.logout();
    });
  });

});
