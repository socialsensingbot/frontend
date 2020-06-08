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
      cy.get(".slider-date-time-max .slider-date").should("contain.text","26-Apr-20");
      cy.get(".slider-date-time-max .slider-time").should("contain.text","10 PM");
      cy.stubLiveJson("live-long");
      cy.wait(65*1000);
      cy.get(".slider-date-time-max .slider-date").should("contain.text","27-Apr-20");
      //TODO: Due to a bug in firefox it displays this as 6 PM not 06 PM
      cy.get(".slider-date-time-max .slider-time").should("contain.text","6 PM");
      cy.logout();
    });

  });


});
