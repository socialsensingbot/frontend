import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS, POWYS_TWEET, POWYS_TWEET_MENU} from "../../../support/e2e";

const sourceOptions = "body .tweet-list-item-menu-source-btn";
const twitterIdClass = POWYS_TWEET;
const url = MAP_URL + "?selected=powys" + "&max_time=" + MAX_DATE_MILLIS + "&min_time=" + MIN_DATE_MILLIS + "&active_number=exceedance&active_polygon=county&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;

let clickSourceMenu = function () {
    return cy.get(POWYS_TWEET_MENU, {timeout: 60000}).click({force: true}).wait(1000)
        .get(sourceOptions).contains("Source")
        .click();

};
describe('00173 Source: : https://github.com/socialsensingbot/frontend/issues/173 ', function () {
    beforeEach(() => {
        cy.stubLiveJson("live-old");
    })

    /*
    <button _ngcontent-byf-c288="" aria-haspopup="true" mat-menu-item="" class="mat-focus-indicator mat-menu-trigger tweet-list-item-menu-impact mat-menu-item mat-menu-item-submenu-trigger ng-tns-c45-22 ng-star-inserted mat-menu-item-highlighted" ng-reflect-menu="[object Object]" role="menuitem" tabindex="0" aria-disabled="false" style="" aria-expanded="true" aria-controls="mat-menu-panel-1">Impact <div matripple="" class="mat-ripple mat-menu-ripple" ng-reflect-disabled="false" ng-reflect-trigger="[object HTMLButtonElement]"></div></button>
     */
    /*
    <button _ngcontent-byf-c288="" mat-menu-item="" class="mat-focus-indicator tweet-list-item-menu-source-type-coastal tweet-list-item-menu-source-type-coastal-not-selected mat-menu-item ng-tns-c45-21 ng-star-inserted" role="menuitem" tabindex="0" aria-disabled="false" style="">1 – Minimal <div matripple="" class="mat-ripple mat-menu-ripple" ng-reflect-disabled="false" ng-reflect-trigger="[object HTMLButtonElement]"></div></button>
     */


    it('Try source', () => {
        cy.visit(url);
        cy.login();
        cy.visitAndWait(url);
        cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
        cy.get(".app-tweet-table", {timeout: 30000});
        cy.get(twitterIdClass, {timeout: 60000});
        cy.get(twitterIdClass, {timeout: 60000}).should('be.visible');
        cy.wait(10000);
        cy.get(POWYS_TWEET_MENU, {timeout: 60000});
        cy.get(POWYS_TWEET_MENU, {timeout: 60000}).should('be.visible');
        clickSourceMenu()
            .get("body .tweet-list-item-menu-source-clear", {timeout: 30000}).click();
        cy.wait(10000);
        clickSourceMenu()
            .get("body .tweet-list-item-menu-source-level-coastal-not-selected", {timeout: 30000}).click();
        cy.wait(10000);
        clickSourceMenu()
            .get("body .tweet-list-item-menu-source-level-coastal-selected", {timeout: 30000})
            .get("body .tweet-list-item-menu-source-level-river-not-selected", {timeout: 30000}).click();
        cy.wait(10000);
        clickSourceMenu()
            .get("body .tweet-list-item-menu-source-level-coastal-not-selected", {timeout: 30000})
            .get("body .tweet-list-item-menu-source-level-river-selected", {timeout: 30000});
        cy.wait(5000);
        cy.visitAndWait(url);
        cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
        cy.get(".app-tweet-table", {timeout: 30000});
        cy.wait(10000);
        clickSourceMenu()
            .get("body .tweet-list-item-menu-source-level-coastal-not-selected", {timeout: 30000})
            .get("body .tweet-list-item-menu-source-level-river-selected", {timeout: 30000});
    });


});
