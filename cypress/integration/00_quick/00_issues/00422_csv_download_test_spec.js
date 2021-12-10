import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";

describe('#422 CSV Download Tests : https://github.com/socialsensingbot/frontend/issues/422',
         function () {
             beforeEach(function () {
                 cy.visit(MAP_URL);
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire";
                 cy.visitAndWait(url);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-west-yorkshire[stroke-width=3]`);
                 cy.wait(10000);
                 cy.twitterPanelHeader("West Yorkshire");
                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(10000);
                 cy.tweetCountTotal(28);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire&selected=cambridgeshire&selected=hertfordshire")
                 cy.multiSelectRegions(["cambridgeshire"]);
                 cy.twitterPanelHeader("2 regions selected");
                 cy.tweetCountTotal(8);
                 cy.url().should("equal",
                                 MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire&selected=hertfordshire")
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-hertfordshire[stroke-width=3]`).click(
                     {force: true});
                 cy.url().should("equal", url);
                 cy.twitterPanelHeader("West Yorkshire");

                 cy.get("app-tweet-export-btn").click();
                 cy.validateCsvFile("multiple-regions*.csv", (list) => {
                     expect(list).to.have.length(3)
                     expect(list[0]).to.deep.equal({
                                                       Age:          '20',
                                                       City:         'Boston',
                                                       'First name': 'Joe',
                                                       'Last name':  'Smith',
                                                       Occupation:   'student',
                                                       State:        'MA',
                                                   })
                 })
             });

             //
             // it('Select from URL', () => {
             //     const url = MAP_URL + "?active_number=stats&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=cambridgeshire&selected=hertfordshire&selected=west%20yorkshire";
             //     cy.visitAndWait(url);
             //     cy.wait(10000);
             //     cy.twitterPanelHeader("3 regions selected");
             //     cy.tweetCountTotal(28);
             //     for (let county of ["cambridgeshire", "hertfordshire", "west-yorkshire"]) {
             //         cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
             //     }
             // });
         });
