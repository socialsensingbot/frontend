import {MAP_URL} from "../../support";

const zoomDuration = 1000;
describe('08 URL State (county): ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })
  describe('select county', () => {
    const url = MAP_URL + "?selected=powys";
    it('when unauthorized and load state', () => {
      cy.visit(url);
      cy.login();
      cy.url({timeout: 30000}).should("equal", url);
      cy.noSpinner();
      cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

      cy.logout();
    });

  });

});
