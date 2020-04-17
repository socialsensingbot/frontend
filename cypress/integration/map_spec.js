describe('Map: ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.login();
  });

  describe('Interact', () => {
    it('with the map', () => {
      cy.get('.content-inner').click();
      cy.get('.map').click();
      cy.get('#logout').click();
      // cy.get('.leaflet-interactive:nth-child(174)').click();

    });

    it('with a tooltip', () => {
      cy.get('body > app-root > div > div > app-map > mat-sidenav-container > mat-sidenav-content > div.map-surround > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g > path:nth-child(174)',{timeout:60000}).trigger("mouseover",{force:true});
      cy.get(".leaflet-tooltip-pane").get("div");
      // cy.get('.leaflet-interactive:nth-child(174)').click();

    });
  });

  describe('Legend', () => {
    const url = "http://localhost:4200/map?active_number=count";
    const legendEntry = "mat-sidenav-content > map-legend > mat-card > div > span:nth-child(1)";
    const statsControl = "div.leaflet-control-container > div.leaflet-top.leaflet-left > div:nth-child(2)";
    const statsFirstLegendColour = "background: rgb(252, 174, 145);";
    const statsFirstLegendVal = " 5–2.5 ";

    const countFirstLegendColour = "background: rgb(43, 140, 190);";
    const countFirstLegendVal = " 150–50 ";

    it('has correct default', () => {
      cy.visit("http://localhost:4200/map");
      cy.get(legendEntry).get("i").should("have.attr", "style").should("eq", statsFirstLegendColour)
      cy.get(legendEntry).should("have.text", statsFirstLegendVal);
    });
    it('changes from URL', () => {
      cy.visit(url);
      cy.url().should("equal", url);
      cy.get(legendEntry).get("i").should("have.attr", "style").should("eq", countFirstLegendColour)
      cy.get(legendEntry).should("have.text", countFirstLegendVal);
    });
    it('changes when stats layer is changed', () => {
      cy.visit(url);
      cy.url().should("equal", url);
      cy.get(legendEntry).get("i").should("have.attr", "style").should("eq", countFirstLegendColour)
      cy.get(legendEntry).should("have.text", countFirstLegendVal);
      cy.get(statsControl).trigger("mouseover")
      cy.get(statsControl + " > section > div.leaflet-control-layers-base > label:nth-child(1) > div > input").click();

      cy.get(legendEntry).get("i").should("have.attr", "style").should("eq", statsFirstLegendColour)
      cy.get(legendEntry).should("have.text", statsFirstLegendVal);
    });
  });


  describe('Twitter drawer', () => {
    const url = "http://localhost:4200/map?selected=powys&min_offset=-5459&max_offset=-2819";
    it('can be closed', () => {
      cy.visit(url);
      cy.wait(1000);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.twitterPanelVisible();
      cy.get("mat-sidenav button.draw-close-button", {timeout: 30000}).click();
      cy.twitterPanelNotVisible();
      cy.logout();
    });
    it('is scrollable', () => {
      cy.visit(url);
      cy.wait(1000);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.twitterPanelVisible();
      cy.get(".atr-1", {timeout: 60000}).should("be.visible");
      cy.get('.tweets-outer').scrollTo('bottom');
      cy.get(".atr-1", {timeout: 20000}).should("not.be.visible");
      cy.logout();
    });
  });


});
