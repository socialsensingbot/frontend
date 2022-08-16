import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support/e2e";
import west_yorkshire from "../../../fixtures/csv_download_west_yorkshire.json";
import basic_3_region_csv from "../../../fixtures/csv_download_3_region.json";

describe('#422 CSV Download Tests : https://github.com/socialsensingbot/frontend/issues/422',
         function () {


             it('Select manually', () => {
                 cy.visit(MAP_URL);
                 cy.login();
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
                 cy.visitAndWait(url);
                 cy.wait(10000);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-west-yorkshire[stroke-width=3]`);
                 cy.wait(2000);
                 cy.twitterPanelHeader("West Yorkshire");
                 cy.get(".app-tweet-export-btn").click();
                 cy.wait(4000);
                 cy.validateCsvFile("west_yorkshire*.csv", (list) => {
                     console.log(list);
                     console.log("list", JSON.stringify(list));
                     cy.log(JSON.stringify(list));
                     cy.writeFile("tmp/csv.json", JSON.stringify(list));
                     cy.fixture("csv_download_west_yorkshire.json").then((json) => {
                         cy.diff(JSON.stringify(list), JSON.stringify(west_yorkshire));
                         expect(list).to.deep.equal(west_yorkshire);
                     })

                 });
                 cy.multiSelectRegions(["powys", "north yorkshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.wait(30000);
                 cy.tweetCountTotal(878);

                 cy.get(".app-tweet-export-btn").click();
                 cy.wait(4000);
                 cy.validateCsvFile("multiple-regions*.csv", (list) => {
                     cy.writeFile("tmp/csv2.json", JSON.stringify(list)).then(ignore => {
                         console.log(JSON.stringify(list));
                         console.log("list", list)
                         cy.log(list);
                         expect(list).to.deep.equal(basic_3_region_csv);
                     })


                 })

                 cy.get(".app-map-expand-toolbar-btn > .mat-button-wrapper > .mat-icon").click();
                 cy.get(".app-map-active-layer-select").click();
                 cy.get(".app-map-als-option-wind").click();

                 /* @TODO: Waiting for data to be fixed in DB - when you read this, uncomment it and fix.
                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire", "west-yorkshire", "northamptonshire"]);
                 cy.wait(10000);
                 cy.tweetCountTotal(0);

                 cy.get(".app-tweet-export-btn").click();

                 cy.validateCsvFile("northamptonshire*.csv", (list) => {
                     console.log(JSON.stringify(list));
                     console.log("list", list)
                                      cy.writeFile("tmp/csv3.json",JSON.stringify(list));
    cy.log(list);
                     expect(list).to.deep.equal(nh_wind);
                 })

                  */
             });

         });
