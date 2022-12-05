import {MAP_URL} from "../../support/e2e";

const zoomDuration = 1000;
describe('08 URL State (county): ', function () {

    describe('select county', () => {
        const url = MAP_URL + "?selected=powys";
        it('when unauthorized and load state', () => {
            cy.visitAndErrorCheck(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.noSpinner();
            cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});

            cy.logout();
        });

    });

});
