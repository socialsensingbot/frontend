import {MAP_URL} from "../../support";

describe('02 Date time: ', function () {
    // Step 1: setup the application state
    beforeEach(function () {
        cy.visit('http://localhost:4200/map/uk-flood-test');
        cy.login();
    });

    //http://localhost:4200/map/uk-flood-test?active_number=stats&zoom=6&max_time=1628812800000&min_time=1628726400000

        describe('select county and date range', () => {
            console.debug("Tests https://github.com/socialsensingbot/frontend/issues/67");
            const url = MAP_URL + "?selected=scottish%20borders&zoom=5&max_time=1629131100000&min_time=1628784000000&active_number=stats&active_polygon=county";
            it('with no tweets', () => {
                cy.visitAndWait(url);
                cy.get(".slider-date-time", {timeout: 20000});
                cy.get(".slider-date-time-min .slider-date").should("contain.text", "13-Aug-21");
                cy.get(".slider-date-time-min .slider-time").should("contain.text", "00 pm");
                cy.get(".slider-date-time-max .slider-date").should("contain.text", "now");
                cy.get(".slider-date-time-max .slider-time").should("contain.text", "");
                cy.get(".app-tweet-drawer", {timeout: 60000}).should("be.visible");
                cy.url().should("equal", url);
                cy.twitterPanelHeader("Scottish Borders", "No Tweets");
                cy.logout();
            });
        });

});
