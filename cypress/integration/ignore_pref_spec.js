describe('Ignore tweets: ', function () {

  describe('ignore tweet', () => {
    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const test = () => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.noSpinner();
      const secondTweet = "twitter-panel .atr-1";
      cy.get(secondTweet).then(row => {
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
          } else if (el.text().trim() === "Unignore Tweet") {
            cy.get(menu2ndOpt).click();
            cy.wait(4000);
            cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Ignore Tweet");
          }
        });
      });
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);
  });


});
