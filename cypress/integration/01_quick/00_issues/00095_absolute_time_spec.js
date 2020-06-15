const zoomDuration = 1000;
describe('URL State: ', function () {
  beforeEach(() => {
  })

  describe('App auto adjusts for past date in date range', () => {
    const url = "http://localhost:4200/map?selected=powys&min_offset=-1439&max_offset=0&abs_time=1587836900000";
    it('when authorized and load state', () => {
      cy.visit("http://localhost:4200/map");
      cy.stubLiveJson("live-short");
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.log(
        "The URL should auto update based on the latest data's latest time, adjusting the min and max offsets accordingly.");
      cy.url({timeout: 20000}).should("equal",
                                      "http://localhost:4200/map?selected=powys&min_offset=-3109&max_offset=-1669&abs_time=1587936900000");
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "24-Apr-20");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "6 PM");
      cy.get(".slider-date-time-max .slider-date", {timeout: 20000}).should("contain.text", "25-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "6 PM");
      cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
      cy.twitterPanelHeader("Powys");
      cy.stubLiveJson("live-long");
      cy.log(
        "We now wait for a data update to occur, the date values on the slider *must not* change. But the URL will be adjusted to the new absolute time.")
      cy.wait(65000)
      cy.url({timeout: 20000}).should("equal",
                                      "http://localhost:4200/map?selected=powys&min_offset=-3589&max_offset=-2149&abs_time=1588009140000");
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "24-Apr-20");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "6 PM");
      cy.get(".slider-date-time-max .slider-date", {timeout: 20000}).should("contain.text", "25-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "6 PM");
      cy.reload();
      cy.log("We confirm the URL has the right information in it by reloading the page.")
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "24-Apr-20");
      cy.get(".slider-date-time-min .slider-time").should("contain.text", "6 PM");
      cy.get(".slider-date-time-max .slider-date", {timeout: 20000}).should("contain.text", "25-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "6 PM");

      cy.logout();
    });
  });


});
