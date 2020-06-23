const twitterIdClass = ".app-twitter-id-1051568984070479874";

describe('03 Ignore tweets: ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })

  const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
  const url = "http://localhost:4200/map?selected=carmarthenshire&max_offset=0&min_offset=-1439";
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
          cy.get(menu2ndOpt).click();
          cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click();
          cy.wait(4000);
          cy.get(tweetHidden, {timeout: 60000});
          cy.get(tweetHidden + " .app-tweet-item", {timeout: 60000});
          cy.get(tweetHidden + " .mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Unignore Tweet");
        } else {
          cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click({force: true});
          cy.get(tweetHidden + " .mat-icon", {timeout: 60000}).click({force: true});
          cy.get(menu2ndOpt).click();
          cy.wait(4000);
          cy.get(".mat-tab-label:nth-child(1)", {timeout: 30000}).click({force: true});
          cy.get(tweetVisible + " .mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Ignore Tweet");
        }

      });
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);


});
