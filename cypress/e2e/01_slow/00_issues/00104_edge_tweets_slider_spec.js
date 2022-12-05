import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS, ONE_DAY_MILLIS} from "../../../support/e2e";

describe('#104 Slider and tweet interaction : https://github.com/socialsensingbot/frontend/issues/104',
         function () {
             beforeEach(function () {
                 cy.visit(MAP_URL);
                 cy.login();
             });

             it('Reproduce Issue', () => {
                 const url = MAP_URL + "?zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + (MAX_DATE_MILLIS - ONE_DAY_MILLIS) + "&active_number=exceedance&active_polygon=county&selected=greater%20london&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
                 cy.visitAndWait(url);
                 cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
                 cy.get(".app-tweet-table", {timeout: 30000});
                 cy.wait(10000);
                 cy.tweetCountTotal(349);
                 cy.log("Set slider to whole 4 days (be great if tweets updated as you did this)");
                 cy.moveMinDateSliderRight(3);
                 cy.moveMinDateSliderLeft(14);
                 cy.wait(5000);
                 cy.url({timeout: 20000}).should("contain",
                                                 "selected=greater%20london");
                 cy.log("Click out of London in any other county (1)");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-cambridgeshire").click();
                 cy.get(".app-tweet-table", {timeout: 30000});
                 cy.wait(10000);
                 cy.tweetCountTotal(46);
                 cy.log("Click back into London (1)");
                 // cy.get(".app-draw-close-button > .mat-button-wrapper > .mat-icon", {timeout: 30000}).click();
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
                 cy.get(".app-tweet-table", {timeout: 30000});
                 cy.wait(10000);
                 cy.twitterPanelHeader("Greater London");
                 cy.wait(5000);
                 cy.tweetCountTotal(349);
                 cy.log("Move time slider back to 1 day back from latest time");
                 cy.moveMinDateSliderRight(7);
                 cy.wait(30000);
                 cy.tweetCountTotal(131);
                 cy.wait(5000);
                 cy.log("Click out of London in any other county (2)");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-wiltshire").click({force: true});
                 cy.wait(5000);
                 cy.tweetCountTotal(1);
                 cy.log("Click back into London (2)");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
                 cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
                 cy.get(".app-tweet-table", {timeout: 30000});
                 cy.wait(5000);
                 cy.twitterPanelHeader("Greater London");
                 cy.tweetCountTotal(131);

             });


         });
