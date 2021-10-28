import {MAP_URL} from "../../support";

describe('04: Map: ', function () {
    // Step 1: setup the application state
    beforeEach(function () {
        cy.visit(MAP_URL);
        cy.stubLiveJson("live-old");
        cy.login();
    });

    describe('Interact', () => {
        it('with the map', () => {
            cy.visitAndWait(MAP_URL);
            cy.get('.content-inner').click();
            cy.get('.map').click();
            cy.get('#logout').click();
            // cy.get('.leaflet-interactive:nth-child(174)').click();

        });

        it('with a tooltip', () => {
            cy.visitAndWait(MAP_URL);
            cy.get(
                'body > app-root > div > div > app-map > mat-sidenav-container > mat-sidenav-content > div.map-surround > div > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > svg > g > path:nth-child(174)',
                {timeout: 60000}).trigger("mouseover", {force: true});
            cy.get(".leaflet-tooltip-pane").get("div");
            // cy.get('.leaflet-interactive:nth-child(174)').click();

        });
    });

    describe('Legend', () => {
        const url = MAP_URL + "?active_number=count";
        const legendEntry = "mat-sidenav-content > map-legend > mat-card > div > span:nth-child(1)";
        const statsFirstLegendColour = "background: rgb(254, 229, 217);";
        const statsFirstLegendVal = " 5–";

        const countFirstLegendColour = "background: rgb(4, 90, 141);";
        const countFirstLegendVal = " 150–";

        it('has correct default', () => {
            cy.visitAndWait(MAP_URL);
            cy.get(legendEntry).should("be.visible");
            cy.get(legendEntry).get("i").should("have.attr", "style").should("contain", statsFirstLegendColour)
            cy.get(legendEntry).should("have.text", statsFirstLegendVal);
        });
        it('changes from URL', () => {
            cy.visitAndWait(url);
            cy.get(legendEntry).should("be.visible");
            cy.get(legendEntry).get("i").should("have.attr", "style").should("contain", countFirstLegendColour)
            cy.get(legendEntry).should("have.text", countFirstLegendVal);
        });
        it('changes when stats layer is changed', () => {
            cy.visitAndWait(url);
            cy.get(legendEntry).should("be.visible");
            cy.get(legendEntry).get("i").should("have.attr", "style").should("contain", countFirstLegendColour)
            cy.get(legendEntry).should("have.text", countFirstLegendVal);

            cy.get(".app-map-expand-toolbar-btn").should("be.visible").click();
            cy.wait(1000);
            cy.get('#mat-select-value-3').click({multiple: true})
            cy.get('#mat-option-7 > .mat-option-text').contains('Exceedance').click();

            cy.get(legendEntry).get("i").should("have.attr", "style").should("contain", statsFirstLegendColour)
            cy.get(legendEntry).should("have.text", statsFirstLegendVal);
        });
    });


    describe('Twitter drawer', () => {
        const url = MAP_URL + "?selected=powys&min_offset=-5459&max_offset=-2819";
        it('can be closed', () => {
            cy.visitAndWait(url);
            cy.twitterPanelVisible();
            cy.get(".app-draw-close-button > .mat-button-wrapper > .mat-icon", {timeout: 30000}).should("be.visible");
            cy.get(".app-draw-close-button > .mat-button-wrapper > .mat-icon", {timeout: 30000}).click();
            cy.twitterPanelNotVisible();
            cy.logout();
        });

    });


});
