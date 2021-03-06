import {MAP_URL} from "../../../support";

describe('#77 Missing tweets : https://github.com/socialsensingbot/frontend/issues/77', function () {
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-03-05-2020");
    cy.login();
  });


  const url = MAP_URL + "?selected=roscommon&max_time=1588538940000&min_time=1588452540000&active_number=stats&active_polygon=county";

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
