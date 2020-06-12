const zoomDuration = 1000;
describe('URL State: ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })

  describe('App auto adjusts for past date in date range', () => {
    const url = "http://localhost:4200/map?selected=powys&min_offset=-1439&max_offset=0&abs_time=1539112400000";
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.log(
        "The URL should auto update based on the latest data's latest time, adjusting the min and max offsets accordingly.");
      cy.url({timeout: 20000}).should("equal",
                                      "http://localhost:4200/map?selected=powys&min_offset=-3119&max_offset=-1679&abs_time=1539212400000");
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "12-Oct-18");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "8 PM");
      cy.get(".slider-date-time-max .slider-date", {timeout: 20000}).should("contain.text", "13-Oct-18");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "8 PM");
      cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.twitterPanelHeader("Powys");

      cy.logout();
    });
  });

});
