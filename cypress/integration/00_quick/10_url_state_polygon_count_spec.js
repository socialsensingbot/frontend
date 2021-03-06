import {MAP_URL} from "../../support";

const zoomDuration = 1000;
describe('05 URL State (polygon): ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })

  describe('select polygon type and count stats', () => {
    const url = MAP_URL + "?active_polygon=coarse&selected=123&active_number=count";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url({timeout: 30000}).should("equal", url);
      cy.noSpinner();
      cy.wait(4000);
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000}).should("have.attr", "fill").should(
        "eq",
        "#2B8CBE");
      cy.twitterPanelHeader("123");
      cy.logout();
    });
    it('when authorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000});
      cy.twitterPanelHeader("123");
      cy.logout();
    });
  });
});
