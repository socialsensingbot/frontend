import {ANALYTICS_URL, MAP_URL} from "../../support/e2e";

const zoomDuration = 1000;

function snapshot(query = 'app-timeseries-multi-query-chart', name = "analytics-timeseries-graph-exceedance-bar") {
    cy.get(query).scrollIntoView()
        .toMatchImageSnapshot({
                                  "imageConfig":      {
                                      "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                      "threshold":       0.01,                      // Amount in pixels or percentage before snapshot image is invalid
                                      "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                  },
                                  "name":             name,            // Naming resulting image file with a custom name rather than concatenating test titles
                                  "separator":        "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                                  "screenshotConfig": {   // Naming resulting image file with a custom separator rather than using the default ` #`
                                      clip: {x: 0, y: 0, width: 1024, height: 600},
                                  }
                              });
}

describe('14 Analytics and Back: ', function () {

    describe("Switch to analytics and then return to the map.", () => {

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
            cy.get('.app-top-links-map').click();
            cy.wait(5000);
            cy.get(".app-tweet-area-loading-spinner").should("not.be.visible");

            // cy.get('#mat-button-toggle-2-button > .mat-button-toggle-label-content').click();
            // cy.wait(4000);
            // snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-graph-exceedance");
            // cy.get('#mat-button-toggle-5-button > .mat-button-toggle-label-content').click();
            // cy.wait(4000);
            // snapshot('app-timeseries-multi-query-chart', "13-analytics-timeseries-graph-exceedance-bar");
        });


    });
});
