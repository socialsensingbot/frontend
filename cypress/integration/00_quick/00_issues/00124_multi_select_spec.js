import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";

describe('#124 Region multi select : https://github.com/socialsensingbot/frontend/issues/124',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire";
                 cy.visitAndWait(url);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-west-yorkshire[stroke-width=3]`);
                 cy.wait(10000);
                 cy.twitterPanelHeader("West Yorkshire");
                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(10000);
                 cy.tweetCountTotal(24);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire&selected=cambridgeshire&selected=hertfordshire")
                 cy.multiSelectRegions(["cambridgeshire"]);
                 cy.twitterPanelHeader("2 regions selected");
                 cy.tweetCountTotal(6);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire&selected=hertfordshire")
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-hertfordshire[stroke-width=3]`).click(
                     {force: true});
                 cy.url().should("equal", url);
                 cy.twitterPanelHeader("West Yorkshire");
             });


             it('Select from URL', () => {
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=cambridgeshire&selected=hertfordshire&selected=west%20yorkshire";
                 cy.visitAndWait(url);
                 cy.wait(10000);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.tweetCountTotal(24);
                 for (let county of ["cambridgeshire", "hertfordshire", "west-yorkshire"]) {
                     cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
                 }
             });
         });
