import {MAP_URL} from "../../support";

const zoomDuration = 1000;
describe('07 URL State (lat/lng): ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })

  describe('select lat & lng', () => {
    const url = MAP_URL + "?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=stats&active_polygon=county&max_time=1539561540000&min_time=1539475200000";
    const newUrl = MAP_URL + "?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=stats&active_polygon=county&max_time=1539561540000&min_time=1539475200000&selected=cambridgeshire";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url({timeout: 30000}).should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-map-pane").should("be.visible");
      cy.get(".leaflet-map-pane").click(100, 100);
      cy.twitterPanelHeader("Cambridgeshire");
      cy.url({timeout: 30000}).should("equal", newUrl);
      cy.logout();
    });
  });


  describe('select county and date range', () => {
    const url = MAP_URL + "?max_time=1539392400000&min_time=1539234000000&active_number=stats&active_polygon=county&selected=powys";
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.url({timeout: 30000}).should("equal", url);
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "now");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "");
      cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.url({timeout: 30000}).should("equal", url);
      cy.twitterPanelHeader("Powys");

      cy.logout();
    });
  });

});
