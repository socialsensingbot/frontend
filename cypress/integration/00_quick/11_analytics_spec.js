import {ANALYTICS_URL, MAP_URL} from "../../support";
import {v4 as uuidv4} from "uuid";

const zoomDuration = 1000;

function snapshot(query = 'app-timeseries-multi-query-chart', name = "analytics-timeseries-graph-exceedance-bar") {
    cy.wait(10000);
    cy.get(query).scrollIntoView()
        .toMatchImageSnapshot({
                                  "imageConfig": {
                                      "createDiffImage": true,                // Should a "diff image" be created, can be disabled for performance
                                      "threshold":       0.05,                      // Amount in pixels or percentage before snapshot image is invalid
                                      "thresholdType":   "percent",             // Can be either "pixel" or "percent"
                                  },
                                  "name":        name,            // Naming resulting image file with a custom name rather than concatenating test titles
                                  "separator":   "_",  // Naming resulting image file with a custom separator rather than using the default ` #`
                              });
}

describe('11 Analytics: ', function () {

    describe("Test Timeseries Graph", () => {
        const url = ANALYTICS_URL + "/time"
        it('Graph Options', () => {
            cy.visit(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.get(".app-loading-progress", {timeout: 60000}).should("not.exist");
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph");
            cy.get('.epp-timeseries-eoc-exceedance').click();
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-exceedance");
            cy.get('.epp-timeseries-eoc-exceedance').click();
            cy.get('.epp-timeseries-lob-line').click();
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-exceedance-bar");
            cy.get('.epp-timeseries-eoc-exceedance').click();
            cy.get('.epp-timeseries-lob-bar').click();
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-exceedance-bar");
            cy.get('.epp-timeseries-eoc-count').click();
            cy.get('.epp-timeseries-lob-line').click();
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-count");
            cy.get('.epp-timeseries-eoc-count').click();
            cy.get('.epp-timeseries-lob-bar').click();
            cy.wait(4000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-count-bar");
            cy.get('.epp-timeseries-eoc-count').click();
            cy.get('.epp-timeseries-lob-bar').click();
            cy.get('.epp-timeseries-period-hour').click();
            cy.wait(20000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-graph-hour-bar-count");
        });

        it('Search Criteria & Save', () => {
            cy.visit(url);
            cy.login();
            cy.url({timeout: 30000}).should("equal", url);
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.get('#mat-input-0').type("everywhere");
            cy.get('#mat-chip-list-input-0').type("Greater L");
            cy.wait(4000);
            cy.get(".mat-option-text").should("contain.text","Greater London");
            cy.get(".mat-option-text").click();
            cy.get('.mat-chip').should("contain.text","Greater London")
            cy.get('.mat-card-actions > .mat-focus-indicator > .mat-button-wrapper').click();
            cy.wait(3000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-criteria-1");
            cy.wait(1000);
            cy.get(':nth-child(1) > .mat-card-content > app-timeseries-analytics-form > .ttc-form > .text-search').type("everywhere");
            cy.get(":nth-child(1) > .mat-card-content > app-timeseries-analytics-form > .ttc-form > .region-chooser").type("Card");
            cy.wait(1000);
            cy.get(".mat-option-text").click();
            cy.get('.mat-chip').should("contain.text","Cardiff")
            cy.get(':nth-child(1) > .mat-card-actions > .mat-focus-indicator > .mat-button-wrapper').click();
            cy.wait(3000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-criteria-2");
            cy.get('.mat-toolbar-row > .mat-primary > .mat-button-wrapper').click();
            cy.wait(1000);
            const title=uuidv4();
            cy.get('input[name=title]').type(title);
            cy.get('.mat-dialog-actions > .mat-primary').click();
            cy.wait(1000);
            cy.url({timeout: 30000}).should("not.be", url);
            cy.get('h2').should("contain.text",title);
            cy.get("div.app-saved-queries-surround > mat-nav-list > a:last-child > div").should("contain.text",title);
            cy.get("div.app-saved-queries-surround > mat-nav-list > a:last-child > div > button > span.mat-button-wrapper > mat-icon").click();
            cy.get('h2').should("not.exist");
            cy.url({timeout: 30000}).should("equal", url);


        });


        it('Import from Map Stats', () => {
            let url = MAP_URL + "?active_number=exceedance&active_polygon=county&selected=greater%20london";
            cy.visit(url);
            cy.login();
            cy.visitAndWait(url);
            cy.twitterPanelHeader("Greater London");
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.get("#mat-tab-label-0-1 > div").click();
            cy.get('.app-stats-panel-count-open-in-analytics').click();
            cy.wait(1000);
            cy.url().should("contain", ANALYTICS_URL + "/time");
            cy.wait(4000);
            cy.get('.mat-chip').should("contain.text", "Greater London");
            cy.wait(3000);
            snapshot('app-timeseries-multi-query-chart', "analytics-timeseries-imported-from-map-1");

        });

    });
});
