describe.only('Ignore tweets: ', function () {

  describe('ignore tweet', () => {
    it('by tweet', () => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.get("twitter-panel .app-twitter-row:nth-child(2) twitter-widget", {timeout: 30000});
      cy.get("twitter-panel .app-twitter-row:nth-child(2) mat-icon").click({force:true});
      cy.get("body .mat-menu-item:nth-child(2)").contains("Ignore Tweet").click();
      cy.get("twitter-panel .app-twitter-row:nth-child(2) mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click();
      cy.get("twitter-panel .app-twitter-row:nth-child(2) mat-icon", {timeout: 30000}).click();
      cy.get("body .mat-menu-item:nth-child(2)").contains("Unignore Tweet").click();
      // cy.logout();
    });
  });



});
