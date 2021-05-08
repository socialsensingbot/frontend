import {MAP_URL} from "../../support";
import {markAsIgnoredMenu, markAsMenu, markAsUnignoredMenu} from "../../support/commands";

const twitterIdClass = ".app-twitter-id-1051568984070479874";

describe('03 Ignore tweets: ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })

  const url = MAP_URL + "?selected=carmarthenshire&max_offset=0&min_offset=-1439";
  const test = () => {
    cy.visit(url);
    cy.login();
    cy.visitAndWait(url);
    const tweetHidden = twitterIdClass + ".atr-hidden";
    const tweetVisible = twitterIdClass + ".atr-visible";
    cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
    cy.get(".app-tweet-table", {timeout: 30000}).then(panel => {
      if (panel.find(twitterIdClass).length > 0) {
        cy.get(tweetVisible, {timeout: 60000});
        cy.get(tweetVisible, {timeout: 60000}).should('be.visible');
        cy.get(tweetVisible + " .app-tweet-item", {timeout: 60000});
        cy.get(tweetVisible + " .app-tweet-item", {timeout: 60000}).should('be.visible');
        cy.get(tweetVisible + " .mat-icon", {timeout: 60000}).click({force: true});
        cy.wait(1000);
        cy.get(markAsMenu).click();
        cy.wait(1000);
        cy.get(markAsIgnoredMenu).click();
        cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click();
        cy.wait(4000);
        cy.get(tweetHidden, {timeout: 60000});
        cy.get(tweetHidden + " .app-tweet-item", {timeout: 60000});
        cy.get(tweetHidden + " .mat-icon", {timeout: 30000}).click({force: true});
        cy.get(markAsMenu).click();
        cy.wait(1000);
        cy.get(markAsUnignoredMenu).contains("Unignored Tweet");
      } else {
        cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click({force: true});
        cy.get(tweetHidden + " .mat-icon", {timeout: 60000}).click({force: true});
        cy.wait(1000);
        cy.get(markAsMenu).click();
        cy.wait(1000);
        cy.get(markAsUnignoredMenu).click();
        cy.wait(4000);
        cy.get(".mat-tab-label:nth-child(1)", {timeout: 30000}).click({force: true});
        cy.get(tweetVisible + " .mat-icon", {timeout: 30000}).click({force: true});
        cy.get(markAsMenu).click();
        cy.wait(1000);
        cy.get(markAsIgnoredMenu).contains("Ignored Tweet");
      }
    });
  };
  it('toggle tweet', test);
  it('toggle tweet again', test);


});
