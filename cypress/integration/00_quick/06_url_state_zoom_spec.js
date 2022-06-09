import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../support";

/*

expected http://localhost:4200/map/uk-flood-test?max_time=1631664000000&min_time=1631059200000&active_number=exceedance&active_polygon=county&zoom=8&max_range_time=1631664000000&min_range_time=1631059200000 to equal
         http://localhost:4200/map/uk-flood-test?max_time=1631664000000&min_time=1631577600000&active_number=exceedance&active_polygon=county&zoom=8&max_range_time=1631664000000&min_range_time=1631059200000

 */
const zoomDuration = 1000;
describe('06 URL State (zoom): ', function () {

    describe('select zoom', () => {
        const rangeTime = "&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=1631059200000"
        const url = MAP_URL + "?max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county";
        it('default zoom', () => {
            cy.visitAndErrorCheck(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.noSpinner();
            cy.wait(zoomDuration)
            cy.get(".map-zoom-in").should("be.visible");
            cy.get(".map-zoom-in").click();
            //zoom delay
            cy.wait(zoomDuration)
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("contain", "zoom=7");
            cy.get(".map-zoom-out").click();
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("contain", "zoom=6");
            cy.logout();
        });

        it('when unauthorized and load state', () => {
            cy.visitAndErrorCheck(url + rangeTime + "&zoom=7");
            cy.login();
            cy.url().should("contain", "zoom=7");
            cy.noSpinner();
            cy.wait(zoomDuration)
            cy.get(".map-zoom-in");
            cy.get(".map-zoom-in").click();
            //zoom delay
            cy.wait(zoomDuration)
            cy.pushStateDelay(); // The push state is not immediate
            cy.url({timeout: 30000}).should("contain", "zoom=8");
            cy.logout();
        });

    });


});
