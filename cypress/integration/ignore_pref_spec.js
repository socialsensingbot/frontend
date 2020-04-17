describe('Ignore tweets: ', function () {

  describe('ignore tweet', () => {
    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const test = () => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.noSpinner();
      const secondTweet = "twitter-panel .app-twitter-row:nth-child(2)";
      cy.get(secondTweet + " twitter-widget", {timeout: 30000});
      cy.get(secondTweet + " mat-icon").click({force: true});
      cy.get(menu2ndOpt).then(el => {
        console.log("'"+el.text()+"'")
        if (el.text().trim() === "Ignore Tweet") {
          cy.get(menu2ndOpt).click();
          cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click();
          cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force:true});
          cy.get(menu2ndOpt).contains("Unignore Tweet");
        } else if (el.text().trim() === "Unignore Tweet") {
          cy.get(menu2ndOpt).click();
          cy.wait(4000);
          cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force:true});
          cy.get(menu2ndOpt).contains("Ignore Tweet");
        }
      })
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);
  });


});
