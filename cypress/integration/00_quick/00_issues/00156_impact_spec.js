import {LONDON_TWEET, LONDON_TWEET_MENU, MAP_URL} from "../../../support";

const twitterIdClass = LONDON_TWEET;
const impactOption = "body .tweet-list-item-menu-impact-btn";
const url = MAP_URL + "?selected=greater%20london&max_offset=0&min_offset=-1439";

let clickImpactMenu = function () {
    cy.get(LONDON_TWEET_MENU, {timeout: 60000}).click({force: true});
    cy.get(impactOption).contains("Impact");
    cy.get(impactOption).click();
    cy.wait(3000);

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
        cy.get(LONDON_TWEET_MENU, {timeout: 60000});
        cy.get(LONDON_TWEET_MENU, {timeout: 60000}).should('be.visible');
        clickImpactMenu();
        cy.get("body .tweet-list-item-menu-impact-clear", {timeout: 30000}).click();
        clickImpactMenu();
        cy.get("body .tweet-list-item-menu-impact-level-minimal-not-selected", {timeout: 30000});
        cy.get("body .tweet-list-item-menu-impact-level-minimal", {timeout: 30000}).click();
        clickImpactMenu();
        cy.get("body .tweet-list-item-menu-impact-level-minimal-selected", {timeout: 30000});
        cy.get("body .tweet-list-item-menu-impact-level-severe-not-selected", {timeout: 30000});
        cy.get("body .tweet-list-item-menu-impact-level-severe", {timeout: 30000}).click();
        clickImpactMenu();
        cy.get("body .tweet-list-item-menu-impact-level-minimal-not-selected", {timeout: 30000});
        cy.get("body .tweet-list-item-menu-impact-level-severe-selected", {timeout: 30000});
        cy.wait(5000);
        cy.visitAndWait(url);
        cy.get(".app-tweet-table", {timeout: 30000});
        clickImpactMenu();
        cy.get("body .tweet-list-item-menu-impact-level-minimal-not-selected", {timeout: 30000});
        cy.get("body .tweet-list-item-menu-impact-level-severe-selected", {timeout: 30000});
    });


});
