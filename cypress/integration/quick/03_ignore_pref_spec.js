describe('Ignore tweets: ', function () {
  beforeEach(()=> {
    cy.stubLiveJson("live-old");
  })
  describe('ignore tweet', () => {
    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const url = "http://localhost:4200/map?selected=powys";
    const test = () => {
      cy.visit(url);
      cy.login();
      cy.visitAndWait(url);
      const tweet = "twitter-panel .atr-0";
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(tweet, {timeout: 30000}).then(row => {
        if (row.hasClass("atr-hidden")) {
          cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).should('be.visible').click();
        } else {
          cy.get(tweet + " twitter-widget", {timeout: 60000}).should('be.visible');
        }
        cy.get(tweet + " mat-icon", {timeout: 60000}).should("be.visible").click({force: true});
        cy.get(menu2ndOpt);
        cy.get(menu2ndOpt).then(el => {
          console.debug("'" + el.text() + "'")
          if (el.text().trim() === "Ignore Tweet") {
            cy.get(menu2ndOpt).click();
            cy.wait(4000);
            // cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).should('be.visible');
            cy.get(tweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Unignore Tweet");
          } else if (el.text().trim() === "Unignore Tweet") {
            cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).scrollIntoView().should('be.visible').click({force: true});
            cy.get(menu2ndOpt).click();
            cy.wait(4000);
            cy.get(tweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Ignore Tweet");
          }
        });
      });
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);
  });


});
