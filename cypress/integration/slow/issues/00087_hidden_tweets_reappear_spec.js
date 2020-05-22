describe('Hidden Tweets Reappear : https://github.com/socialsensingbot/frontend/issues/87 : ', function () {
  before(() => {
  })
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })
  describe("Hidden tweets reappearing after refresh", () => {

    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const url = "http://localhost:4200/map?selected=carmarthenshire";
    const test = (refresh, count) => {
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      const tweetHidden = ".atr-0.atr-hidden";
      const tweetVisible = ".atr-0.atr-visible";
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(".atr-0", {timeout: 30000}).then(panel => {
        let expectHiddenAfterRefresh;
        if (panel.hasClass("atr-hidden")) {
          cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).should('be.visible');
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.get(tweetHidden + " mat-icon", {timeout: 60000}).should("be.visible").click({force: true});
          cy.get(menu2ndOpt).click();
          cy.wait(1000);
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.get(tweetVisible + " mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Ignore Tweet");
          expectHiddenAfterRefresh = false;

        } else {
          cy.get(tweetVisible, {timeout: 60000});
          cy.get(tweetVisible, {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " .twitter-tweet", {timeout: 60000});
          cy.get(tweetVisible + " .twitter-tweet", {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " mat-icon", {timeout: 60000}).should("be.visible").click({force: true});
          cy.get(menu2ndOpt).click();
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.wait(1000);
          cy.get(tweetHidden, {timeout: 60000});
          cy.get(tweetHidden + " .twitter-tweet", {timeout: 60000});
          cy.get(tweetHidden + " mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Unignore Tweet");
          expectHiddenAfterRefresh = true;
        }
        if(refresh) {
          cy.visit("http://localhost:4200/map?selected=carmarthenshire");
          cy.login();
          cy.noSpinner();
        }
        if (expectHiddenAfterRefresh) {
          cy.get(tweetHidden, {timeout: 30000}).should('be.visible');
        } else {
          cy.get(tweetVisible + ".atr-visible", {timeout: 60000});
        }
      });
    };
    //The actual bug was a lack of paging, so we need to do over 2*10 ignores to see the failure for certain.
    for(let i= 0; i < 21; i++) {
      it('toggle tweet '+i, ()=>test(false,i));
    }
    it('toggle tweet with refresh', ()=>test(true,22));

    for(let i= 0; i < 21; i++) {
      it('toggle tweet again '+i, ()=>test(false,i));
    }
    it('toggle tweet again with refresh', ()=>test(true, 22));
  });


});
