import {ANALYTICS_URL, DASHBOARD_URL} from "../../support";
import {v4 as uuidv4} from "uuid";

const zoomDuration = 1000;

function snapshot(query = 'app-timeseries-multi-query-chart', name = "analytics-timeseries-graph-exceedance-bar") {
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
    beforeEach(() => {
        cy.stubLiveJson("live-old");
    })

    describe("Test Timeseries Graph", () => {
        const url = DASHBOARD_URL ;
        const analyticsUrl= ANALYTICS_URL + "/time";


        it('Export from Analytics', () => {
            cy.visit(analyticsUrl);
            cy.login();
            cy.url({timeout: 30000}).should("equal", analyticsUrl);
            cy.get("#loading-div", {timeout: 60000}).should("not.exist");
            cy.get('#mat-input-0').type("everywhere");
            cy.get('#mat-chip-list-input-0').type("Greater L");
            cy.wait(4000);
            cy.get(".mat-option-text").click();
            cy.get('.mat-chip').should("contain.text","Greater London")
            cy.get('.mat-card-actions > .mat-focus-indicator > .mat-button-wrapper').click();
            cy.wait(1000);
            cy.get(':nth-child(1) > .mat-card-content > app-timeseries-analytics-form > .ttc-form > .text-search').type("everywhere");
            cy.get(":nth-child(1) > .mat-card-content > app-timeseries-analytics-form > .ttc-form > .region-chooser").type("Card");
            cy.wait(1000);
            cy.get(".mat-option-text").click();
            cy.get('.mat-chip').should("contain.text","Cardiff")
            cy.get(':nth-child(1) > .mat-card-actions > .mat-focus-indicator > .mat-button-wrapper').click();
            cy.wait(1000);
            cy.get('.app-analytics-timeseries-toolbar-add-to-dashboard').click();
            cy.wait(1000);
            const title=uuidv4();
            cy.get('input[name=title]').type(title);
            cy.get('.mat-dialog-actions > .mat-primary').click();
            cy.wait(1000);
            cy.url({timeout: 30000}).should("not.be", url);
            // snapshot('app-timeseries-multi-query-chart', "dashboard-export-from-analytics-1");
            cy.get("app-dashboard > div > mat-grid-list > div > mat-grid-tile:last-child > figure > mat-card .dashboard-card-title" ).should("contain.text",title);
            cy.get("app-dashboard > div > mat-grid-list > div > mat-grid-tile:last-child > figure > mat-card")
            cy.wait(1000);
            // snapshot('app-dashboard > div > mat-grid-list > div > mat-grid-tile:last-child > figure > mat-card app-timeseries-multi-query-chart', "dashboard-export-from-analytics-1");
            cy.get("app-dashboard > div > mat-grid-list > div > mat-grid-tile:last-child > figure > mat-card .dashboard-card-menu-btn").click();
            cy.wait(1000);
            cy.get('.dashboard-card-menu-item-remove').click();
            cy.wait(1000);
            cy.get("app-dashboard > div > mat-grid-list > div > mat-grid-tile:last-child > figure > mat-card .dashboard-card-title" ).should("not.contain.text",title);
        });
    });
});
