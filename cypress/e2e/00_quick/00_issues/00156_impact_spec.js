import {MAP_URL, POWYS_TWEET, POWYS_TWEET_MENU} from "../../../support/e2e";

const twitterIdClass = POWYS_TWEET;
const impactOption = "body .tweet-list-item-menu-impact-btn";
const url = MAP_URL + "?selected=powys";

let clickImpactMenu = function (menu, test) {
    cy.wait(1000);
    cy.get("body").find(POWYS_TWEET).should('have.length', 1)
    cy.get("body").find(POWYS_TWEET_MENU).should('have.length', 1)
    cy.get(POWYS_TWEET_MENU, {timeout: 60000}).click();
    cy.wait(1000);
    cy.get(".cdk-overlay-connected-position-bounding-box");
    cy.get("div.cdk-overlay-connected-position-bounding-box:nth-child(2)");
    cy.get('div.cdk-overlay-connected-position-bounding-box:nth-child(2) .mat-menu-panel')
        .contains("Impact")
        .click()
        .get("div.cdk-overlay-connected-position-bounding-box:nth-child(3)")
        .then($el => {
            if (test) {
                cy.get(test, {timeout: 30000});
            }
            cy.wrap($el).contains(menu).click()
        })

};

describe('00156 Impact: : https://github.com/socialsensingbot/frontend/issues/156', function () {

    /*
    <button _ngcontent-byf-c288="" aria-haspopup="true" mat-menu-item="" class="mat-focus-indicator mat-menu-trigger tweet-list-item-menu-impact mat-menu-item mat-menu-item-submenu-trigger ng-tns-c45-22 ng-star-inserted mat-menu-item-highlighted" ng-reflect-menu="[object Object]" role="menuitem" tabindex="0" aria-disabled="false" style="" aria-expanded="true" aria-controls="mat-menu-panel-1">Impact <div matripple="" class="mat-ripple mat-menu-ripple" ng-reflect-disabled="false" ng-reflect-trigger="[object HTMLButtonElement]"></div></button>
     */
    /*
    <button _ngcontent-byf-c288="" mat-menu-item="" class="mat-focus-indicator tweet-list-item-menu-impact-level-minimal tweet-list-item-menu-impact-level-minimal-not-selected mat-menu-item ng-tns-c45-21 ng-star-inserted" role="menuitem" tabindex="0" aria-disabled="false" style="">1 – Minimal <div matripple="" class="mat-ripple mat-menu-ripple" ng-reflect-disabled="false" ng-reflect-trigger="[object HTMLButtonElement]"></div></button>
     */


    it('Try impacts', () => {
        cy.visit(url);
        cy.login();
        cy.visitAndWait(url);
        cy.wait(10000);
        cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
        cy.get(".app-tweet-table", {timeout: 30000});
        cy.get(twitterIdClass, {timeout: 60000});
        cy.get(twitterIdClass, {timeout: 60000}).should('be.visible');
        clickImpactMenu("Clear");
        clickImpactMenu("Minimal", "body .tweet-list-item-menu-impact-level-minimal-not-selected");
        clickImpactMenu("Severe", "body .tweet-list-item-menu-impact-level-minimal-selected");
        cy.wait(5000);
        cy.visitAndWait(url);
        cy.get(".app-tweet-table", {timeout: 30000});
        cy.wait(5000);
        cy.get(POWYS_TWEET)
            .get(POWYS_TWEET_MENU, {timeout: 60000})
            .click()
            .get('div.cdk-overlay-connected-position-bounding-box:nth-child(2) .mat-menu-panel')
            .contains("Impact")
            .click()
            .get("div.cdk-overlay-connected-position-bounding-box:nth-child(3)")
            .then($el => {
                cy.get("body .tweet-list-item-menu-impact-level-minimal-not-selected", {timeout: 30000})
                    .get("body .tweet-list-item-menu-impact-level-severe-selected", {timeout: 30000});
            })
    });


});
