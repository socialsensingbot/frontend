import {ANALYTICS_URL, MAP_URL} from "../../support";

const zoomDuration = 1000;
describe('11 Analytics: ', function () {
    beforeEach(() => {
        cy.stubLiveJson("live-old");
    })

    describe("Test graph image", () => {
        const url = ANALYTICS_URL + "/time"
        it('Timeseries page', () => {
            cy.visit(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.wait(4000);
            cy.get('app-timeseries-multi-query-chart')
                .toMatchImageSnapshot({
                                          "imageConfig": {
                                              "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                              "threshold":       0.05,                      // Amount in pixels or percentage before snapshot image is invalid
                                              "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                          },
                                          "name":        "analytics-timeseries-graph",            // Naming resulting image file with a custom name rather than concatenating test titles
                                          "separator":   "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                                      });

            cy.get('#mat-button-toggle-2-button > .mat-button-toggle-label-content').click();
            cy.wait(4000);
            cy.get('app-timeseries-multi-query-chart')
                .toMatchImageSnapshot({
                                          "imageConfig": {
                                              "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                              "threshold":       0.05,                      // Amount in pixels or percentage before snapshot image is invalid
                                              "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                          },
                                          "name":        "analytics-timeseries-graph-exceedance",            // Naming resulting image file with a custom name rather than concatenating test titles
                                          "separator":   "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                                      });
            cy.get('#mat-button-toggle-5-button > .mat-button-toggle-label-content').click();
            cy.wait(4000);
            cy.get('app-timeseries-multi-query-chart')
                .toMatchImageSnapshot({
                                          "imageConfig": {
                                              "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                              "threshold":       0.05,                      // Amount in pixels or percentage before snapshot image is invalid
                                              "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                          },
                                          "name":        "analytics-timeseries-graph-exceedance-bar",            // Naming resulting image file with a custom name rather than concatenating test titles
                                          "separator":   "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                                      });
        });
    });
});
