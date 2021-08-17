import {MAP_URL} from "../../../support";

const sourceOptions = "body .tweet-list-item-menu-source";
const twitterIdClass = ".app-twitter-id-1427408666253275139";
const url = MAP_URL + "?selected=greater%20london&max_offset=0&min_offset=-1439";

let clickSourceMenu = function () {
  cy.get(twitterIdClass + " .mat-icon", {timeout: 60000}).click({force: true});
  cy.get(sourceOptions).contains("Source");
  cy.get(sourceOptions).click();
  cy.wait(3000);

};
describe('00173 Source: ', function () {
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
    cy.get(twitterIdClass + " .app-tweet-item", {timeout: 60000});
    cy.get(twitterIdClass + " .app-tweet-item", {timeout: 60000}).should('be.visible');
    clickSourceMenu();
    cy.get("body .tweet-list-item-menu-source-type-clear", {timeout: 30000}).click();
    clickSourceMenu();
    cy.get("body .tweet-list-item-menu-source-type-coastal-not-selected", {timeout: 30000});
    cy.get("body .tweet-list-item-menu-source-type-coastal", {timeout: 30000}).click();
    clickSourceMenu();
    cy.get("body .tweet-list-item-menu-source-type-coastal-selected", {timeout: 30000});
    cy.get("body .tweet-list-item-menu-source-type-river-not-selected", {timeout: 30000});
    cy.get("body .tweet-list-item-menu-source-type-river", {timeout: 30000}).click();
    clickSourceMenu();
    cy.get("body .tweet-list-item-menu-source-type-coastal-not-selected", {timeout: 30000});
    cy.get("body .tweet-list-item-menu-source-type-river-selected", {timeout: 30000});
    cy.wait(5000);
    cy.visitAndWait(url);
    cy.get(".app-tweet-table", {timeout: 30000});
    clickSourceMenu();
    cy.get("body .tweet-list-item-menu-source-type-coastal-not-selected", {timeout: 30000});
    cy.get("body .tweet-list-item-menu-source-type-river-selected", {timeout: 30000});
  });


});
