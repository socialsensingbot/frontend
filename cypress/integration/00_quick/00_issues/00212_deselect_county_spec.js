import {MAP_URL} from "../../../support";

const zoomDuration = 1000;
describe('#212 Deselect by clicking on non-region: : https://github.com/socialsensingbot/frontend/issues/212',
         function () {
             beforeEach(() => {
             })
             describe('select county', () => {
                 const url = MAP_URL + "?selected=powys&active_number=exceedance&active_polygon=county";
                 it('when unauthorized and load state', () => {
                     cy.visit(url);
                     cy.login();
                     cy.url({timeout: 30000}).should("equal", url);
                     cy.noSpinner();
                     cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
      cy.wait(2000);
      cy.get(".map").click(128,128);
                     cy.wait(2000);
                     cy.url({timeout: 30000}).should("equal",
                                                     MAP_URL + "?active_number=exceedance&active_polygon=county&");
                     cy.logout();
    });

  });

});
