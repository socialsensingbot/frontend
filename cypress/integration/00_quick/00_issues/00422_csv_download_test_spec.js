import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support";
import west_yorkshire from "../../../fixtures/csv_download_west_yorkshire.json";
import basic_3_region_csv from "../../../fixtures/csv_download_3_region.json";
import nh_wind from "../../../fixtures/csv_download_northamptonshire_wind.json";

describe('#422 CSV Download Tests : https://github.com/socialsensingbot/frontend/issues/422',
         function () {
             beforeEach(function () {
                 cy.visit(MAP_URL);
                 cy.login();
             });


             it('Select manually', () => {
                 const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=west%20yorkshire";
                 cy.visitAndWait(url);
                 cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-west-yorkshire[stroke-width=3]`);
                 cy.wait(2000);
                 cy.twitterPanelHeader("West Yorkshire");
                 cy.get(".app-tweet-export-btn").click();
                 cy.validateCsvFile("west_yorkshire*.csv", (list) => {
                     console.log(list);
                     console.log("list", JSON.stringify(list));
                     cy.log(JSON.stringify(list));
                     cy.fixture("csv_download_west_yorkshire.json").then((json) => {
                         cy.diff(JSON.stringify(list), JSON.stringify(west_yorkshire));
                         expect(list).to.deep.equal(west_yorkshire);
                     })

                 });
                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire"]);
                 cy.twitterPanelHeader("3 regions selected");
                 cy.tweetCountTotal(24);

                 cy.get(".app-tweet-export-btn").click();
                 cy.validateCsvFile("multiple-regions*.csv", (list) => {
                     console.log(JSON.stringify(list));
                     console.log("list", list)
                     cy.log(list);
                     expect(list).to.deep.equal(basic_3_region_csv);
                 })

                 cy.get(".app-map-expand-toolbar-btn > .mat-button-wrapper > .mat-icon").click();
                 cy.get(".app-map-active-layer-select").click();
                 cy.get(".app-map-als-option-wind").click();

                 cy.multiSelectRegions(["cambridgeshire", "hertfordshire", "west-yorkshire", "northamptonshire"]);
                 cy.wait(4000);
                 cy.tweetCountTotal(3);

                 cy.get(".app-tweet-export-btn").click();

                 cy.validateCsvFile("northamptonshire*.csv", (list) => {
                     console.log(JSON.stringify(list));
                     console.log("list", list)
                     cy.log(list);
                     expect(list).to.deep.equal(nh_wind);
                 })
             });

             //
             // it('Select from URL', () => {
             //     const url = MAP_URL + "?active_number=exceedance&active_polygon=county&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&zoom=5&selected=cambridgeshire&selected=hertfordshire&selected=west%20yorkshire";
             //     cy.visitAndWait(url);
             //     cy.wait(10000);
             //     cy.twitterPanelHeader("3 regions selected");
             //     cy.tweetCountTotal(28);
             //     for (let county of ["cambridgeshire", "hertfordshire", "west-yorkshire"]) {
             //         cy.get(`div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${county}[stroke-width=3]`);
             //     }
             // });
         });
