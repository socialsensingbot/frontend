import {ANALYTICS_URL, MAP_URL} from "../../support";

const zoomDuration = 1000;

function snapshot(query = 'app-timeseries-multi-query-chart', name = "analytics-timeseries-graph-exceedance-bar") {
    cy.get(query).scrollIntoView()
        .toMatchImageSnapshot({
                                  "imageConfig": {
                                      "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                      "threshold":       0.01,                      // Amount in pixels or percentage before snapshot image is invalid
                                      "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                  },
                                  "name":        name,            // Naming resulting image file with a custom name rather than concatenating test titles
                                  "separator":   "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                              });
}

describe('11 Analytics: ', function () {

    describe("Test Timeseries Graph", () => {
        const url = ANALYTICS_URL + "/time"

        it('Import from Map Stats', () => {
            let url = MAP_URL + "?active_number=exceedance&active_polygon=county&selected=greater%20london";
            cy.visitAndErrorCheck(url);
            cy.login();
            cy.visitAndWait(url);
            cy.twitterPanelHeader("Greater London");
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.get("#mat-tab-label-0-1 > div").click();
            cy.get('.app-stats-panel-count-open-in-analytics').click();
            cy.wait(1000);
            cy.url().should("contain", ANALYTICS_URL + "/time");
            cy.wait(5000);
            cy.get('.mat-chip').should("contain.text", "Greater London");
            cy.wait(3000);
            snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-imported-from-map-1");

            cy.url({timeout: 30000}).should("equal",
                                            ANALYTICS_URL + "/time?active_number=count&active_polygon=county&selected=greater%20london&max_time=1631664000000&min_time=1631577600000&active_layer=flood");
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-graph");

            // cy.get('#mat-button-toggle-2-button > .mat-button-toggle-label-content').click();
            // cy.wait(4000);
            // snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-graph-exceedance");
            // cy.get('#mat-button-toggle-5-button > .mat-button-toggle-label-content').click();
            // cy.wait(4000);
            // snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-graph-exceedance-bar");
        });


    });
});
