describe('Issue https://github.com/socialsensingbot/frontend/issues/87 : ', function () {
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })
  describe.only("Hidden tweets reappearing after refresh", () => {
    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const test = (refresh) => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.noSpinner();
      const secondTweet = "twitter-panel .atr-1";
      let expectHiddenAfterRefresh = false;
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(secondTweet, {timeout: 30000}).should("be.visible");
      cy.get(secondTweet, {timeout: 30000}).then(row => {
        if (row.find("mat-expansion-panel").length > 0) {
          cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click();

        } else {
          cy.get(secondTweet + " twitter-widget", {timeout: 60000});

        }

        cy.get(secondTweet + " mat-icon").should("be.visible").click({force: true});
        cy.get(menu2ndOpt).then(el => {
          console.debug("'" + el.text() + "'")
          if (el.text().trim() === "Ignore Tweet") {
            cy.get(menu2ndOpt).click();
            cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click();
            cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Unignore Tweet");
            expectHiddenAfterRefresh = false;
          } else if (el.text().trim() === "Unignore Tweet") {
            cy.get(menu2ndOpt).click();
            cy.wait(4000);
            cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Ignore Tweet");
            expectHiddenAfterRefresh = true;
          }
        });
        if(refresh) {
          cy.visit("http://localhost:4200/map?selected=powys");
        }
        if (expectHiddenAfterRefresh) {
          cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible');
        } else {
          cy.get(secondTweet + " twitter-widget", {timeout: 60000});
        }
      });
    };
    it('toggle tweet', ()=>test(false));
    it('toggle tweet again', ()=>test(false));
    it('toggle tweet with refresh', ()=>test(true));
    it('toggle tweet again with refresh', ()=>test(true));
  });


});
