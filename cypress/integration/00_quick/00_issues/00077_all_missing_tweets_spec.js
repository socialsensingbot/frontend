describe('Missing tweets : https://github.com/socialsensingbot/frontend/issues/77', function () {
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-03-05-2020");
    cy.login();
  });


  const url = "http://localhost:4200/map?abs_time=1588540140000&max_offset=-20&min_offset=-1460&selected=roscommon";

  it('Should be two tweets both removed', () => {
    cy.visit(url);
    cy.url().should("equal", url);
    cy.noSpinner();
    cy.url().should("equal", url);
    cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
    cy.twitterPanelHeader("Roscommon");
    cy.get(".app-tweet-drawer").find(".app-tweet-item-no-longer-available").its("length").should("eq", 2);
    cy.noSpinner();
    cy.logout();
  });


});
