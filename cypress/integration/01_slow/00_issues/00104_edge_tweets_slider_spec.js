import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS, ONE_DAY_MILLIS} from "../../../support";

describe('#104 Slider and tweet interaction : https://github.com/socialsensingbot/frontend/issues/104',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.stubLiveJson("live-02-06-2020");
                 cy.login();
             });

             it('Reproduce Issue', () => {
                 const url = MAP_URL + "?selected=greater%20london&zoom=5&max_time=" + MAX_DATE_MILLIS + "&min_time=" + (MAX_DATE_MILLIS - ONE_DAY_MILLIS) + "&active_number=stats&active_polygon=county";
                 cy.visitAndWait(url);
                 cy.tweetCountTotal(9);
                 cy.log("Set slider to whole 4 days (be great if tweets updated as you did this)");
                 cy.moveMinDateSliderRight(3);
                 cy.moveMinDateSliderLeft(14);
                 cy.wait(1000);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?selected=greater%20london&zoom=5&max_time=1629158400000&min_time=1628809200000&active_number=stats&active_polygon=county");
                 cy.log("Click out of London in any other county (1)");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-cork").click();
                 cy.wait(5000);
                 cy.tweetCountTotal(3);
                 cy.log("Click back into London (1)");
                 cy.get(".app-draw-close-button > .mat-button-wrapper > .mat-icon", {timeout: 30000}).click();
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
                 cy.wait(3000);
                 cy.twitterPanelHeader("Greater London");
                 cy.tweetCountTotal(37);
                 cy.log("Move time slider back to 1 day back from latest time");
                 cy.moveMinDateSliderRight(7);
                 cy.wait(3000);
                 cy.tweetCountTotal(10);
                 cy.wait(1000);
                 cy.log("Click out of London in any other county (2)");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-cork").click({force: true});
                 cy.wait(1000);
                 cy.tweetCountTotal(1);
                 cy.log("Click back into London (2)");
                 cy.get(".app-draw-close-button > .mat-button-wrapper > .mat-icon", {timeout: 30000}).click();
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-greater-london").click({force: true});
                 cy.wait(1000);
                 cy.twitterPanelHeader("Greater London");
                 cy.tweetCountTotal(10);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?selected=greater%20london&zoom=5&max_time=1629158400000&min_time=1629061200000&active_number=stats&active_polygon=county");

             });


         });
