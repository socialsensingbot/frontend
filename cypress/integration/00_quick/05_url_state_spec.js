import {MAP_URL} from "../../support";

const zoomDuration = 1000;
describe('05 URL State (polygon): ', function () {

  describe('select polygon type', () => {
    const url = MAP_URL + "?active_polygon=coarse&selected=123";
    it('when unauthorized and load state', () => {
      cy.visitAndWait(url);
        cy.login();
      cy.url({timeout: 30000}).should("equal", url);
      cy.noSpinner();

      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.twitterPanelHeader("123");
      cy.logout();
    });

  });

});
