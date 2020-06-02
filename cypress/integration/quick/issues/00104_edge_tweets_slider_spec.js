describe('Slider and tweet interaction : https://github.com/socialsensingbot/frontend/issues/104', function () {
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-02-06-2020");
    cy.login();
  });

  it('Reproduce Issue', () => {
    Cypress.currentTest.retries(0);
    console.debug("Tests ");
    const url = "http://localhost:4200/map?selected=greater%20london";
    cy.visitAndWait(url);
    cy.log("Click on London")
    cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path[stroke='#EA1E63']").then(london => {
      const londonPath = london.index();
      cy.tweetCountTotal(46);
      cy.log("Set slider to whole 5 days (be great if tweets updated as you did this)")
      cy.get(".ng5-slider-pointer-min")
        .first()
          .click({force: true});
        cy.get(".ng5-slider-pointer-min").type('{pagedown}{pagedown}{pagedown}{pagedown}{pagedown}{pagedown}{pagedown}')
        cy.wait(20000);
        cy.tweetCountTotal(148);
        cy.log("Click out of London in any other county");
        cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path[stroke='white']").first().click();
        cy.wait(4000);
        cy.tweetCountTotal(6);
        cy.log("Click back into London");
        cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path:nth-child(" + londonPath + ")").click({force: true});
        cy.wait(4000);
        cy.tweetCountTotal(148);
        cy.log("Move time slider back to 1 day back from latest time")
        cy.get(".ng5-slider-pointer-min").type('{pageup}{pageup}{pageup}{pageup}{pageup}{pageup}{pageup}')
        cy.wait(20000);
        cy.log("Click out of London in any other county");
        cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path[stroke='white']").first().click();
        cy.tweetCountTotal(1);
        cy.log("Click back into London.");
        cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path:nth-child(" + londonPath + ")").click({force: true});
        cy.tweetCountTotal(46);
      })


    });


});
