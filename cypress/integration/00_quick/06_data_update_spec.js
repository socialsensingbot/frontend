/**
 * These tests test the change of data from the server.
 */
describe('Data Update: ', function () {
  describe('slider change', () => {
    const url = "http://localhost:4200/map";
    it('after scheduled update', ()=> {
      //See commands.js - stubLiveJson stubs out the call to S3 to get live.json
      cy.stubLiveJson("live-short");
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      cy.get(".slider-date-time", {timeout: 20000});
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "26-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "10 PM");
      cy.url().should("equal", "http://localhost:4200/map?abs_time=1587940500000&max_offset=0&min_offset=-1429")
      cy.stubLiveJson("live-long");
      cy.wait(65 * 1000);
      cy.get(".slider-date-time-max .slider-date").should("contain.text", "26-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text", "10 PM");
      cy.url().should("equal", "http://localhost:4200/map?abs_time=1588012740000&max_offset=-469&min_offset=-1909");
      cy.logout();
    });

  });


});
