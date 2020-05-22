describe('Ignore tweets: ', function () {
  beforeEach(()=> {
    cy.stubLiveJson("live-old");
  })
  describe('ignore tweet', () => {
    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const url = "http://localhost:4200/map?selected=carmarthenshire";
    const test = () => {
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      const tweetHidden = ".atr-0.atr-hidden";
      const tweetVisible = ".atr-0.atr-visible";
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(".atr-0", {timeout: 30000}).then(panel => {
        if (panel.hasClass("atr-hidden")) {
          cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).should('be.visible');
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.get(tweetHidden + " mat-icon", {timeout: 60000}).should("be.visible").click({force: true});
          cy.get(menu2ndOpt).click();
          cy.wait(4000);
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.get(tweetVisible + " mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Ignore Tweet");
        } else {
          cy.get(tweetVisible, {timeout: 60000});
          cy.get(tweetVisible, {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " .twitter-tweet", {timeout: 60000});
          cy.get(tweetVisible + " .twitter-tweet", {timeout: 60000}).should('be.visible');
          cy.get(tweetVisible + " mat-icon", {timeout: 60000}).should("be.visible").click({force: true});
          cy.get(menu2ndOpt).click();
          cy.get(".hidden-tweet-container mat-panel-title",
                 {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
          cy.wait(4000);
          cy.get(tweetHidden, {timeout: 60000});
          cy.get(tweetHidden + " .twitter-tweet", {timeout: 60000});
          cy.get(tweetHidden + " mat-icon", {timeout: 30000}).click({force: true});
          cy.get(menu2ndOpt).contains("Unignore Tweet");
        }

      });
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);
  });


});
