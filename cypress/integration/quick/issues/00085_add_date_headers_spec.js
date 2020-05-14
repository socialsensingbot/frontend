describe.only('Date headers : https://github.com/socialsensingbot/frontend/issues/85', function () {
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.login();
  });

  describe('empty results', () => {
    it('should not appear', () => {
      console.debug("Tests ");
      const url = "http://localhost:4200/map?selected=tipperary";
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.url().should("equal", url);
      cy.get(".tweet-drawer", {timeout: 60000}).should("be.visible");
      cy.get(".date-separator").should("not.exist");
    });
  });

  describe('non empty results', () => {
    it('should appear', () => {
      console.debug("Tests ");
      const url = "http://localhost:4200/map?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";
      cy.visit(url);
      cy.url().should("equal", url);
      cy.noSpinner();
      cy.url().should("equal", url);
      cy.get(".tweet-drawer", {timeout: 60000}).should("be.visible");
      cy.get(".date-separator").should("exist");
    });
  });

  //todo: test different scenarios

});
