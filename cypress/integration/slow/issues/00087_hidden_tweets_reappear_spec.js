describe('Issue https://github.com/socialsensingbot/frontend/issues/87 : ', function () {
  before(() => {
    cy.visit("http://localhost:4200/map?selected=carmarthenshire");
    cy.login();
    cy.noSpinner();
  })
  beforeEach(() => {
    cy.stubLiveJson("live-old");
  })
  describe("Hidden tweets reappearing after refresh", () => {

    const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
    const test = (refresh,count) => {

      const secondTweet = "twitter-panel .atr-"+count;
      let expectHiddenAfterRefresh = false;
      cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
      cy.get(secondTweet, {timeout: 30000}).scrollIntoView().should("be.visible");
      cy.get(secondTweet, {timeout: 30000}).then(row => {
        if (row.find("mat-expansion-panel").length > 0) {
          cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click({force: true});

        } else {
          cy.get(secondTweet + " twitter-widget", {timeout: 60000});

        }

        cy.get(secondTweet + " mat-icon").should("be.visible").click({force: true});
        cy.get(menu2ndOpt).then(el => {
          console.debug("'" + el.text() + "'")
          if (el.text().trim() === "Ignore Tweet") {
            cy.get(menu2ndOpt).click();
            cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible').click({force: true});
            cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Unignore Tweet");
            expectHiddenAfterRefresh = false;
          } else if (el.text().trim() === "Unignore Tweet") {
            cy.get(menu2ndOpt).click({force: true});
            cy.wait(4000);
            cy.get(secondTweet + " mat-icon", {timeout: 30000}).click({force: true});
            cy.get(menu2ndOpt).contains("Ignore Tweet");
            expectHiddenAfterRefresh = true;
          }
        });
        if(refresh) {
          cy.visit("http://localhost:4200/map?selected=carmarthenshire");
          cy.login();
          cy.noSpinner();
        }
        if (expectHiddenAfterRefresh) {
          cy.get(secondTweet + " mat-expansion-panel mat-panel-title", {timeout: 30000}).should('be.visible');
        } else {
          cy.get(secondTweet + " twitter-widget", {timeout: 60000});
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
