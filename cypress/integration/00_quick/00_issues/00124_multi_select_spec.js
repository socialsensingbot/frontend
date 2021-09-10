import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";

describe('#124 Region multi select : https://github.com/socialsensingbot/frontend/issues/124',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=powys";
                 cy.visitAndWait(url);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-powys[stroke-width=3]`);
                 cy.wait(10000);
                 cy.twitterPanelHeader("Powys");
                 cy.multiSelectRegions(["ceredigion", "carmarthenshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(10000);
                 cy.tweetCountTotal(108);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=powys&selected=ceredigion&selected=carmarthenshire")
                 cy.multiSelectRegions(["ceredigion"]);
                 cy.twitterPanelHeader("2 regions selected");
                 cy.tweetCountTotal(90);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=stats&active_polygon=county&max_time="+MAX_DATE_MILLIS + "&min_time="+MIN_DATE_MILLIS+"&zoom=5&selected=powys&selected=carmarthenshire")
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-powys[stroke-width=3]`).click(
                     {force: true});
                 cy.url().should("equal", url);
                 cy.twitterPanelHeader("Powys");
             });


             it('Select from URL', () => {
                 const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time="+ MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=powys&selected=ceredigion&selected=carmarthenshire";
                 cy.visitAndWait(url);
                 cy.wait(10000);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.tweetCountTotal(2);
                 for (let county of ["powys", "ceredigion", "carmarthenshire"]) {
                     cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
                 }
             });
         });
