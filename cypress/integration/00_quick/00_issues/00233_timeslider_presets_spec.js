import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";

describe('#233 Timeslide presets: : https://github.com/socialsensingbot/frontend/issues/233', function () {
    // Step 1: setup the application state
    beforeEach(function () {
        cy.visit(MAP_URL);
        cy.login();
    });

    describe('select 3 hours', () => {
        const url = MAP_URL + "?zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county&selected=greater%20london";
        it('with no tweets', () => {
            cy.visitAndWait(url);
            cy.get(".slider-date-time", {timeout: 20000});
            cy.get(".slider-date-time-max .slider-date").should("contain.text", "now");
            cy.get(".slider-date-time-max .slider-time").should("contain.text", "");
            cy.get(".slider-date-time-min .slider-date").should("contain.text", "14-Sept-21");
            cy.get(".slider-date-time-min .slider-time").should("contain.text", "01 am");
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.get('#mat-tab-label-1-0 > .mat-tab-label-content').should("have.text", "172 Tweets");
            cy.url().should("equal", url);
            cy.get('.app-map-timer-preset-select').click();
            cy.get('#mat-option-4 > .mat-option-text').click();
            cy.wait(4000);
            cy.get(".slider-date-time-min .slider-date").should("contain.text", "14-Sept-21");
            cy.get(".slider-date-time-min .slider-time").should("contain.text", "10 pm");
            cy.log("Checking for Drop down time range issues. #275")
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.url().should("equal",
                            MAP_URL + "?zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + (MAX_DATE_MILLIS - 3 * 60 * 60 * 1000) + "&active_number=exceedance&active_polygon=county&selected=greater%20london");
            cy.get('#mat-tab-label-1-0').should("have.text", "8 Tweets");
            cy.get('.app-map-timer-preset-select').click();
            cy.get('#mat-option-1 > .mat-option-text').click();
            cy.wait(4000);
            cy.get(".slider-date-time-min .slider-date").should("contain.text", "14-Sept-21");
            cy.get(".slider-date-time-min .slider-time").should("contain.text", "00 am");
            cy.log("Checking for Drop down time range issues. #275")
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.url().should("equal",
                            MAP_URL + "?zoom=5&max_time=1631660399999&min_time=1631574000000&active_number=exceedance&active_polygon=county&selected=greater%20london");
            cy.get('#mat-tab-label-1-0').should("have.text", "168 Tweets");
            cy.logout();
        });
    });

});
