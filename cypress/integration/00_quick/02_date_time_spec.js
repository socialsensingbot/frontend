import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS, TS_SELECTED_MIN_DATE, TS_SELECTED_MIN_TIME} from "../../support";

describe('02 Date time: ', function () {
    // Step 1: setup the application state
    beforeEach(function () {
        cy.visitAndWait('http://localhost:4200/map/uk-flood-test');
        cy.login();
    });

    //http://localhost:4200/map/uk-flood-test?active_number=exceedance&zoom=6&max_time=1628812800000&min_time=1628726400000

    describe('select county and date range', () => {
        console.debug("Tests https://github.com/socialsensingbot/frontend/issues/67");
        const url = MAP_URL + "?zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county&selected=scottish%20borders&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
        it('with no tweets', () => {
            cy.visitAndWait(url);
            cy.get(".slider-date-time", {timeout: 20000});
            cy.wait(10000);
            cy.get(".slider-date-time-min .slider-date").should("contain.text", TS_SELECTED_MIN_DATE);
            cy.get(".slider-date-time-min .slider-time").should("contain.text", TS_SELECTED_MIN_TIME);
            cy.get(".slider-date-time-max .slider-date").should("contain.text", "now");
            cy.get(".slider-date-time-max .slider-time").should("contain.text", "");
            cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
            cy.url().should("equal", url);
            cy.twitterPanelHeader("Scottish Borders", "No Tweets");
            cy.logout();
        });
    });

});
