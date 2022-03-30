import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../support";

const zoomDuration = 1000;
describe('07 URL State (lat/lng): ', function () {


  describe('select lat & lng', () => {
      const url = MAP_URL + "?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS;
      const newUrl = MAP_URL + "?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&selected=cambridgeshire";
      it('when unauthorized and load state', () => {
          cy.visit(url);
          cy.login();
          cy.url({timeout: 30000}).should("equal", url);
          cy.noSpinner();
          cy.get(".map").should("be.visible");
          cy.get(".x-feature-name-cambridgeshire").click(100, 100, {force: true});
          cy.twitterPanelHeader("Cambridgeshire");
          cy.url({timeout: 30000}).should("equal", newUrl);
          cy.logout();
    });
  });


  describe('select county and date range', () => {
      const url = MAP_URL + "?max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county&selected=powys";
    it('when authorized and load state', () => {
        cy.visit("http://localhost:4200/map");
        cy.login();
        cy.visitAndWait(url);
        cy.get(".slider-date-time", {timeout: 20000});
        cy.url({timeout: 30000}).should("equal", url);
        cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "14-Sept-21");
        cy.get(".slider-date-time-min .slider-time").should("contain.text", "00 am");
        cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
        cy.url({timeout: 30000}).should("equal", url);
        cy.twitterPanelHeader("Powys");

        cy.logout();
    });
  });

});
