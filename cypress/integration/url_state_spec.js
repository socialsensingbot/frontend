describe('URL State: ', function () {
  beforeEach(()=> {
    cy.stubLiveJson("live-old");
  })
  describe('select county', () => {
    const url = "http://localhost:4200/map?selected=powys";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });
  });

  describe('select polygon type', () => {
    const url = "http://localhost:4200/map?active_polygon=coarse&selected=123";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();

      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.twitterPanelHeader("44 Tweets from 123");
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.twitterPanelHeader("44 Tweets from 123");
      cy.logout();
    });
  });
  describe('select polygon type and count stats', () => {
    const url = "http://localhost:4200/map?active_polygon=coarse&selected=123&active_number=count";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000}).should("have.attr","fill").should("eq","#2B8CBE");
      cy.twitterPanelHeader("44 Tweets from 123");
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.twitterPanelHeader("44 Tweets from 123");
      cy.logout();
    });
  });

  describe('select zoom', () => {
    const url = "http://localhost:4200/map";
    const urlZoom6 = "http://localhost:4200/map?zoom=6"; //default zoom
    const urlZoom7 = "http://localhost:4200/map?zoom=7";
    const urlZoom8 = "http://localhost:4200/map?zoom=8";
    it('default zoom', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-control-zoom-in").click();
      cy.wait(4000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url({timeout:30000}).should("equal", urlZoom7);
      cy.get(".leaflet-control-zoom-out").click();
      cy.wait(4000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url({timeout:30000}).should("equal", urlZoom6);
      cy.logout();
    });

    it('when unauthorized and load state', () => {
      cy.visit(urlZoom7);
      cy.login();
      cy.url().should("equal", urlZoom7);
      cy.noSpinner();
      cy.get(".leaflet-control-zoom-in").click();
      cy.wait(4000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url({timeout:30000}).should("equal", urlZoom8);
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(urlZoom7);
      cy.login();
      cy.visit(urlZoom7);
      cy.url().should("equal", urlZoom7);
      cy.noSpinner();
      cy.get(".leaflet-control-zoom-in").click();
      cy.wait(10000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url({timeout:30000}).should("equal", urlZoom8);
      cy.logout();
    });
  });


  describe('select lat & lng', () => {
    const url = "http://localhost:4200/map?zoom=11&lat=52.3336607715546&lng=0.05321502685546875";
    const newUrl = "http://localhost:4200/map?zoom=11&lat=52.3336607715546&lng=0.05321502685546875&selected=cambridgeshire";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".mat-sidenav-content").click(500,500);
      cy.wait(4000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url().should("equal", newUrl);
      cy.twitterPanelHeader("Showing 2 of 2 Tweets from Cambridgeshire");
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".mat-sidenav-content").click(500,500);
      cy.wait(10000); // The push state is not immediate (about 2s delay) (for performance)
      cy.url({timeout:20000}).should("equal", newUrl);
      cy.twitterPanelHeader("Showing 2 of 2 Tweets from Cambridgeshire");
      cy.logout();
    });
  });


  describe('select county and date range', () => {
    const url = "http://localhost:4200/map?selected=powys&min_offset=-5459&max_offset=-2819";
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time .slider-date").should("contain.text","11-Oct-18");
      cy.get(".slider-date-time .slider-time").should("contain.text","05 AM");
      cy.get(".tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.get("twitter-panel .tweets-header  mat-card > span > b", {timeout: 40000}).should("contain.text","Showing 8 of 8 Tweets from Powys");
      cy.twitterPanelHeader("Showing 8 of 8 Tweets from Powys");

      cy.logout();
    });
  });

});
