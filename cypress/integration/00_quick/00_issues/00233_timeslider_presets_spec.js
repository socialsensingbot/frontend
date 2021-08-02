import {MAP_URL} from "../../../support";

describe('#233 Timeslide presets: ', function () {
    // Step 1: setup the application state
    beforeEach(function () {
        cy.visit('http://localhost:4200/map');
        cy.stubLiveJson("live-old");
        cy.login();
    });

    describe('select 3 hours', () => {
        const url = MAP_URL + "?selected=greater%20london&zoom=5&max_time=1539561540000&min_time=1539475200000&active_number=stats&active_polygon=county";
        it('with no tweets', () => {
            cy.visitAndWait(url);
            cy.get(".slider-date-time", {timeout: 20000});
            cy.get(".slider-date-time-max .slider-date").should("contain.text", "now");
            cy.get(".slider-date-time-max .slider-time").should("contain.text", "");
            cy.get(".slider-date-time-min .slider-date").should("contain.text", "13-Oct-18");
            cy.get(".slider-date-time-min .slider-time").should("contain.text", "11 pm");
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.get('#mat-tab-label-1-0').should("have.text", "59 Tweets");
            cy.url().should("equal", url);
            cy.get('.mat-select-placeholder').click();
            cy.get('#mat-option-2 > .mat-option-text').click();
            cy.get(".slider-date-time-min .slider-date").should("contain.text", "14-Oct-18");
            cy.get(".slider-date-time-min .slider-time").should("contain.text", "8 pm");
            cy.log("Checking for Drop down time range issues. #275")
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.url().should("equal",
                            MAP_URL + "?selected=greater%20london&zoom=5&max_time=1539561540000&min_time=1539550740000&active_number=stats&active_polygon=county");
            cy.get('#mat-tab-label-1-0').should("have.text", "9 Tweets");
            cy.logout();
        });
    });

});
