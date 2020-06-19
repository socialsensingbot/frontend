describe('#104 lider and tweet interaction : https://github.com/socialsensingbot/frontend/issues/104', function () {
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-02-06-2020");
    cy.login();
  });

  it('Reproduce Issue', () => {
    const url = "http://localhost:4200/map?selected=greater%20london&min_offset=-1557&max_offset=0";
    cy.visitAndWait(url);
    cy.tweetCountTotal(49);
    cy.log("Set slider to whole 5 days (be great if tweets updated as you did this)");
    cy.moveMinDateSliderLeft(8);
    cy.wait(1000);
    cy.url({timeout: 20000}).should("equal",
                                    "http://localhost:4200/map?selected=greater%20london&min_offset=-5757&max_offset=0&abs_time=1591100940000");
    cy.log("Click out of London in any other county");
    cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-armagh").click();
    cy.wait(1000);
    cy.tweetCountTotal(6);
    cy.log("Click back into London");
    cy.get("mat-sidenav button.draw-close-button", {timeout: 30000}).click();
    cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
    cy.wait(1000);
    cy.twitterPanelHeader("Greater London");
    cy.tweetCountTotal(148);
    cy.log("Move time slider back to 1 day back from latest time");
    cy.moveMinDateSliderRight(7);

    cy.wait(1000);
    cy.log("Click out of London in any other county");
    cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-armagh").click();
    cy.wait(1000);
    cy.tweetCountTotal(1);
    cy.log("Click back into London.");
    cy.get("mat-sidenav button.draw-close-button", {timeout: 30000}).click();
    cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
    cy.wait(1000);
    cy.twitterPanelHeader("Greater London");
    cy.tweetCountTotal(49);
    cy.url({timeout: 20000}).should("equal",
                                    "http://localhost:4200/map?selected=greater%20london&min_offset=-1557&max_offset=0&abs_time=1591100940000");

  });


});