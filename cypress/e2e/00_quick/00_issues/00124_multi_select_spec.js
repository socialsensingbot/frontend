import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support/e2e";

describe('#124 Region multi select : https://github.com/socialsensingbot/frontend/issues/124',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=powys&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
                 cy.visitAndWait(url);
                 cy.wait(2000);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-powys[stroke-width=3]`);
                 cy.wait(2000);
                 cy.twitterPanelHeader("Powys");
                 cy.multiSelectRegions(["cambridgeshire", "inverclyde"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(2000);
                 cy.tweetCountTotal(53);
                 cy.url().should("contain", "selected=powys&selected=cambridgeshire&selected=inverclyde&max_range_time")
                 cy.multiSelectRegions(["cambridgeshire"]);
                 cy.twitterPanelHeader("2 regions selected");
                 cy.wait(2000);
                 cy.tweetCountTotal(7);
                 cy.url().should("contain",
                                 "selected=inverclyde&max_range_time");
                 cy.multiSelectRegions(["inverclyde"]);
                 cy.url().should("not.contain",
                                 "selected=inverclyde&max_range_time");
                 cy.twitterPanelHeader("Powys");
             });


             it('Do Select from URL', () => {
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=cambridgeshire&selected=powys&selected=inverclyde&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
                 cy.visitAndWait(url);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(2000);
                 cy.tweetCountTotal(53);
                 for (let county of ["cambridgeshire", "powys", "inverclyde"]) {
                     cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
                 }
             });
         });
