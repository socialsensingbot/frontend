describe('Infinite Scroll (https://github.com/socialsensingbot/frontend/issues/10): ', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
    cy.stubLiveJson("live-old");
    cy.server();
    cy.login();
  });

  describe('scroll', () => {
    const url = "http://localhost:4200/map?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";

    it('row changes', () => {
      cy.mockGraphQL();
      cy.visitAndWait(url);
      cy.twitterPanelHeader("from");
      cy.get(".atr-0.atr-visible", {timeout: 90000})
      cy.get(".atr-0.atr-visible .twitter-tweet", {timeout: 90000}).should("be.visible");

      cy.log(
        "There should be 3 pages of 20 tweets loaded at any time. The first page should contain 20 tweets and the fourth page should contain no tweets.");

      cy.get("twitter-panel").find('.tweet-page .app-twitter-row-active').its('length').should('eq', 60);
      cy.get(".tweet-page-0").find('.app-twitter-row-active').its('length').should('eq', 20);
      cy.get(".tweet-page-3 .app-twitter-row-active").should("not.exist");

      cy.log("Now we scroll to the bottom.");

      cy.get('.tweets-outer').scrollTo('bottom');
      cy.wait(1000);

      cy.log(
        "There should be 3 pages of 20 tweets loaded at any time. The first page should not have any visible tweets and the fourth page should contain 20 tweets.");

      cy.get("twitter-panel").find('.tweet-page .app-twitter-row-active').its('length').should('be.gt', 60);
      cy.get(".tweet-page-0 .app-twitter-row-active").should("not.be.visible");
      cy.get(".tweet-page-3").find('.app-twitter-row-active').its('length').should('eq', 20);
      cy.get(".atr-0", {timeout: 20000}).should("not.be.visible");

      cy.log("Now we scroll back to the top.");

      cy.get('.tweets-outer').scrollTo('top');
      cy.wait(1000);

      cy.log(
        "There should be 3 pages of 20 tweets loaded at any time. The first page should again contain 20 tweets and the fourth page should now contain no tweets.");
      cy.get("twitter-panel").find('.tweet-page .app-twitter-row-active').its('length').should('eq', 60);
      cy.get(".tweet-page-0").find('.app-twitter-row-active').its('length').should('eq', 20);
      cy.get(".tweet-page-3 .app-twitter-row-active").should("not.exist");

      cy.log("And the first tweet should be visible and loaded.")

      cy.get(".atr-0.atr-visible", {timeout: 90000}).should("be.visible");
      cy.get(".atr-0.atr-visible .twitter-tweet", {timeout: 90000}).should("be.visible");
    });

    it('top and bottom', () => {
      cy.mockGraphQL();
      cy.visitAndWait(url);
      cy.twitterPanelHeader("from");
      cy.get(".atr-0.atr-visible", {timeout: 90000})
      cy.get(".atr-0.atr-visible").scrollIntoView()
      cy.get(".atr-0.atr-visible", {timeout: 90000}).should("be.visible");
      cy.get('.tweets-outer').scrollTo('bottom');
      cy.get(".atr-0", {timeout: 20000}).should("not.be.visible");
      cy.logout();
    });


  });

  describe('various side effects', () => {
    const url = "http://localhost:4200/map?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";

    it('correct row count', () => {
      cy.visitAndWait(url);
      cy.twitterPanelHeader("from");
      cy.get("twitter-panel .tweets-header  mat-card > span > b").then(header => {
        const headerParts = header.text().trim().split(" ");
        assert(headerParts[0] === "Showing");
        assert(headerParts[2] === "of");
        const visibleCount = +headerParts[1];
        const totalCount = +headerParts[3];
        cy.get(".hidden-tweet-container mat-panel-title", {timeout: 30000}).should('be.visible');
        cy.get(".hidden-tweet-container mat-panel-title",
               {timeout: 30000}).scrollIntoView().should('be.visible').click();
        cy.get(".hidden-tweet-container mat-panel-title")
          .then(title => {
                  const hiddenCount = +title.text().trimLeft().split(" ")[0];
                  cy.get(".hidden-tweet-container").find('.atr-hidden').its('length').should('eq', hiddenCount);

                  expect(hiddenCount).to.equal(totalCount - visibleCount);
                }
          );

      })


    })
  });


})
;
