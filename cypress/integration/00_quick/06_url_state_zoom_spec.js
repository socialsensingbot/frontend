import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../support";

const zoomDuration = 1000;
describe('06 URL State (zoom): ', function () {
    beforeEach(() => {
        cy.stubLiveJson("live-old");
    })


    describe('select zoom', () => {
        const url = MAP_URL + "?max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=stats&active_polygon=county";
        const urlZoom6 = url + "&zoom=6"; //default zoom
        const urlZoom7 = url + "&zoom=7";
        const urlZoom8 = url + "&zoom=8";
        it('default zoom', () => {
            cy.visit(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.noSpinner();
            cy.wait(zoomDuration)
            cy.get(".map-zoom-in").should("be.visible");
            cy.get(".map-zoom-in").click();
            //zoom delay
            cy.wait(zoomDuration)
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("equal", urlZoom7);
            cy.get(".map-zoom-out").click();
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("equal", urlZoom6);
            cy.logout();
        });

        it('when unauthorized and load state', () => {
            cy.visit(urlZoom7);
            cy.login();
            cy.url().should("equal", urlZoom7);
            cy.noSpinner();
            cy.wait(zoomDuration)
            cy.get(".map-zoom-in");
            cy.get(".map-zoom-in").click();
            //zoom delay
            cy.wait(zoomDuration)
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("equal", urlZoom8);
            cy.logout();
        });

    });


});
