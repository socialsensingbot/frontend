import {MAP_URL} from "../../support/e2e";

const zoomDuration = 1000;
describe('05 URL State (polygon): ', function () {

    describe('select polygon type and count stats', () => {
        const url = MAP_URL + "?active_polygon=coarse&selected=168&active_number=count";
        it('when unauthorized and load state', () => {
            cy.visitAndErrorCheck(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.noSpinner();
            cy.wait(4000);
            cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000}).should("have.attr",
                                                                                                "fill").should(
                "eq",
                "#045A8D");
            cy.twitterPanelHeader("168");
            cy.logout();
        });
        it('when authorized and load state', () => {
            cy.visitAndErrorCheck(url);
            cy.login();
            cy.visitAndWait(url);
            cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 60000});
            cy.twitterPanelHeader("168");
            cy.logout();
        });
    });
});
