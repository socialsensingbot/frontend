describe('#10 Infinite Scroll (https://github.com/socialsensingbot/frontend/issues/10): ', function () {

  const pageSize = 5;
  const minPages = 3;

  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.server();
    cy.login();
  });


  describe('scroll', () => {
    const url = "http://localhost:4200/map/live?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";

    it('row changes', () => {
      cy.mockGraphQL();
      cy.visitAndWait(url);
      cy.twitterPanelHeader("Carmarthenshire");
      cy.get(".atr-0.atr-visible", {timeout: 90000})
      cy.get(".atr-0.atr-visible .twitter-tweet", {timeout: 90000}).should("be.visible");

      cy.log(
        `There should be ${minPages} pages of ${pageSize} tweets loaded at any time. The first page should contain ${pageSize} tweets and the fourth page should contain no tweets.`);

      cy.get("twitter-panel").find('.app-tweet-paged .app-tweet-row-active').its('length').should('eq',
                                                                                                  minPages * pageSize);
      cy.get(".app-tweet-page-0").find('.app-tweet-row-active').its('length').should('eq', pageSize);
      cy.get(`.app-tweet-page-${minPages} .app-tweet-row-active`).should("not.exist");

      cy.log("Now we scroll to the bottom.");

      cy.get('.app-tweet-list').scrollTo('bottom');
      cy.wait(5000);
      cy.get('.app-tweet-list').scrollTo('bottom');
      cy.wait(5000);

      cy.log(
        `There should be ${minPages} pages of ${pageSize} tweets loaded at any time. The first page should not have any visible tweets and the fourth page should contain ${pageSize} tweets.`);

      cy.get("twitter-panel").find('.app-tweet-paged .app-tweet-row-active').its('length').should('be.gt',
                                                                                                  minPages * pageSize);
      cy.get(".app-tweet-page-0 .app-tweet-row-active").should("not.be.visible");
      cy.get(`.app-tweet-page-${minPages}`).find('.app-tweet-row-active').its('length').should('eq', pageSize);
      cy.get(".atr-0", {timeout: 20000}).should("not.be.visible");

      cy.log("Now we scroll back to the top.");

      cy.get('.app-tweet-list').scrollTo('top');
      cy.wait(5000);
      cy.get('.app-tweet-list').scrollTo('top');
      cy.wait(5000);

      cy.log(
        `There should be ${minPages} pages of ${pageSize} tweets loaded at any time. The first page should again contain ${pageSize} tweets and the fourth page should now contain no tweets.`);
      cy.get("twitter-panel").find('.app-tweet-paged .app-tweet-row-active').its('length').should('eq',
                                                                                                  minPages * pageSize);
      cy.get(".app-tweet-page-0").find('.app-tweet-row-active').its('length').should('eq', pageSize);
      cy.get(`.app-tweet-page-${minPages} .app-tweet-row-active`).should("not.exist");

      cy.log("And the first tweet should be visible and loaded.")

      cy.get(".atr-0.atr-visible", {timeout: 90000}).should("be.visible");
      cy.get(".atr-0.atr-visible .twitter-tweet", {timeout: 90000}).should("be.visible");
    });

    it('top and bottom', () => {
      cy.mockGraphQL();
      cy.visitAndWait(url);
      cy.twitterPanelHeader("Carmarthenshire");
      cy.get(".atr-0.atr-visible", {timeout: 90000})
      cy.get(".atr-0.atr-visible").scrollIntoView()
      cy.get(".atr-0.atr-visible", {timeout: 90000}).should("be.visible");
      cy.get('.app-tweet-list').scrollTo('bottom');
      cy.get(".atr-0", {timeout: 20000}).should("not.be.visible");
      cy.logout();
    });


  });

  describe('various side effects', () => {
    const url = "http://localhost:4200/map/live?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";

    it('correct row count', () => {
      cy.visitAndWait(url);
      cy.twitterPanelHeader("Carmarthenshire");
      cy.get(".mat-tab-label:nth-child(1)").then(header => {
        const headerParts = header.text().trim().split(" ");
        const visibleCount = +headerParts[0];
        const totalCount = 215;
        const hiddenCount = totalCount - visibleCount;
        cy.get(".app-tweet-outer .atr-visible", {timeout: 5000});
        cy.get(".app-tweet-outer").find('.atr-visible').its('length').should('eq', visibleCount);

        cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click()
          .then(title => {
                  const hiddenCount = +title.text().trimLeft().split(" ")[0];
                  if (hiddenCount > 0) {
                    cy.get(".app-tweet-outer").find('.atr-hidden').its('length').should('eq', hiddenCount);
                  } else {
                    cy.get(".app-tweet-outer .atr-hidden").should("not.exist");
                  }

                }
          );

      })


    })
  });


})
;
