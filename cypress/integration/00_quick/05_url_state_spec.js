const zoomDuration = 1000;
describe('05 URL State: ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })
  describe('select county', () => {
    const url = "http://localhost:4200/map/live?selected=powys";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });

  });

  describe('select polygon type', () => {
    const url = "http://localhost:4200/map/live?active_polygon=coarse&selected=123";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();

      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.twitterPanelHeader("123");
      cy.logout();
    });

  });
  describe('select polygon type and count stats', () => {
    const url = "http://localhost:4200/map/live?active_polygon=coarse&selected=123&active_number=count";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000}).should("have.attr", "fill").should(
        "eq",
        "#2B8CBE");
      cy.twitterPanelHeader("123");
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000});
      cy.twitterPanelHeader("123");
      cy.logout();
    });
  });

  describe('select zoom', () => {
    const url = "http://localhost:4200/map/live?max_time=1539475200000&min_time=1539216000000&active_number=stats&active_polygon=county";
    const urlZoom6 = url + "&zoom=6"; //default zoom
    const urlZoom7 = url + "&zoom=7";
    const urlZoom8 = url + "&zoom=8";
    it('default zoom', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.wait(zoomDuration)
      cy.get(".map-zoom-in").should("be.visible");
      cy.get(".map-zoom-in").click();
      //zoom delay
      cy.wait(zoomDuration)
      cy.pushStateDelay(); // The push state is not immediate
      cy.url({timeout: 30000}).should("equal", urlZoom7);
      cy.get(".map-zoom-out").click();
      cy.pushStateDelay(); // The push state is not immediate
      cy.url({timeout: 30000}).should("equal", urlZoom6);
      cy.logout();
    });

    it('when unauthorized and load state', () => {
      cy.visit(urlZoom7);
      cy.login();
      cy.url().should("equal", urlZoom7);
      cy.noSpinner();
      cy.wait(zoomDuration)
      cy.get(".map-zoom-in");
      cy.get(".map-zoom-in").click();
      //zoom delay
      cy.wait(zoomDuration)
      cy.pushStateDelay(); // The push state is not immediate
      cy.url({timeout: 30000}).should("equal", urlZoom8);
      cy.logout();
    });

  });


  describe('select lat & lng', () => {
    const url = "http://localhost:4200/map/live?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=stats&active_polygon=county&max_time=1539561540000&min_time=1539475200000";
    const newUrl = "http://localhost:4200/map/live?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&active_number=stats&active_polygon=county&max_time=1539561540000&min_time=1539475200000&selected=cambridgeshire";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-map-pane").should("be.visible");
      cy.get(".leaflet-map-pane").click(300, 300);
      cy.pushStateDelay(); // The push state is not immediate
      cy.url({timeout: 30000}).should("equal", newUrl);
      cy.twitterPanelHeader("Cambridgeshire");
      cy.logout();
    });
  });


  describe('select county and date range', () => {
    const url = "http://localhost:4200/map/live?max_time=1539392400000&min_time=1539234000000&active_number=stats&active_polygon=county&selected=powys";
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.url().should("equal", url);
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "11-Oct-18");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "5 am");
      cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.url().should("equal", url);
      cy.twitterPanelHeader("Powys");

      cy.logout();
    });
  });

});
