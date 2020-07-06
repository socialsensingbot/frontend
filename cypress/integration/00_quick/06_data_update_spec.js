/**
 * These tests test the change of data from the server.
 */
describe('Data Update: ', function () {
  describe('slider change', () => {
    const url = "http://localhost:4200/map/live?selected=powys&max_time=1587941160000&min_time=1587854760000&active_number=stats&active_polygon=county";
    it('after scheduled update', () => {
      //See commands.js - stubLiveJson stubs out the call to S3 to get live.json
      cy.stubLiveJson("live-short");
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "26-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "10 pm");
      cy.url().should("equal", url)
      cy.stubLiveJson("live-long"); // and prosper
      cy.wait(65 * 1000);
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "26-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "10 pm");
      cy.url().should("equal", url);
      cy.logout();
    });

  });


});
