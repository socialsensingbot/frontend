const twitterIdClass = ".app-twitter-id-1051568984070479874";

describe('Hidden Tweets Reappear : https://github.com/socialsensingbot/frontend/issues/87 : ', function () {

  before(() => {
  })

  beforeEach(() => {
    cy.visit(url);
    cy.login();
    cy.visitAndWait(url);
    cy.stubLiveJson("live-old");
  })

  describe("Hidden tweets reappearing after refresh", () => {

    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const url = "http://localhost:4200/map?selected=carmarthenshire";
    const test = (refresh, count) => {
      const tweetHidden = twitterIdClass + ".atr-0.atr-hidden";
      const tweetVisible = twitterIdClass + ".atr-0.atr-visible";
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(".table_info", {timeout: 30000}).then(panel => {
        let expectHiddenAfterRefresh;
        if (panel.find(twitterIdClass).length > 0) {
          cy.get(tweetVisible, {timeout: 60000});
          cy.get(tweetVisible, {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " .app-twitter-tweet", {timeout: 60000});
          cy.get(tweetVisible + " .app-twitter-tweet", {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " .mat-icon", {timeout: 60000}).click({force: true});
          cy.get(menu2ndOpt).click();
          cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click();
          cy.wait(4000);
          cy.get(tweetHidden, {timeout: 60000});
          cy.get(tweetHidden + " .app-twitter-tweet", {timeout: 60000});
          cy.get(tweetHidden + " .mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Unignore Tweet");
          expectHiddenAfterRefresh = true;
        } else {
          cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click({force: true});
          cy.get(tweetHidden + " .mat-icon", {timeout: 60000}).click({force: true});
          cy.get(menu2ndOpt).click();
          cy.wait(4000);
          cy.get(".mat-tab-label:nth-child(1)", {timeout: 30000}).click({force: true});
          cy.get(tweetVisible + " .mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Ignore Tweet");
          expectHiddenAfterRefresh = false;
        }
        if (refresh) {
          cy.visit(url);
          cy.noSpinner();
        }
        if (expectHiddenAfterRefresh) {
          cy.get(tweetHidden, {timeout: 30000}).should('be.visible');
        } else {
          cy.get(tweetVisible, {timeout: 60000});
        }
      });
    };
    //The actual bug was a lack of paging, so we need to do over 2*10 ignores to see the failure for certain.
    for (let i = 0; i < 11; i++) {
      it('toggle tweet ' + i, () => test(false, i));
    }
    it('toggle tweet with refresh', () => test(true, 12));

    for (let i = 0; i < 11; i++) {
      it('toggle tweet again ' + i, () => test(false, i));
    }
    it('toggle tweet again with refresh', () => test(true, 12));
  });


});
