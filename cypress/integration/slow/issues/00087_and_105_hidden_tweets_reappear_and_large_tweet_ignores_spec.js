const url = "http://localhost:4200/map?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004";
const menu2ndOpt = "body .mat-menu-item:nth-child(2)";

const checkTabCounts = (clickTab) => {
  cy.wait(4000);
  cy.withTweetCounts((vis1, hid1) => {
    cy.visit(url);
    cy.noSpinner();
    cy.clickTweetTab(clickTab);
    cy.withTweetCounts((vis2, hid2) => {
      console.log("Testing for the same hidden and visible counts after refresh.")
      expect(vis1).equals(vis2);
      expect(hid1).equals(hid2);
    });

  });
};

const testUnhide = (refresh, count, fail) => {
  cy.log("Un-ignoring " + count);

  const tweetHidden = ".atr-0.atr-hidden";
  cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
  cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
  cy.get(".tweet-drawer", {timeout: 30000}).then(drawer => {
    if (!fail && drawer.find(tweetHidden).length === 0) {
      cy.log("Skipping non existent tweet");
    } else {
      cy.get(tweetHidden).scrollIntoView();
      cy.get(tweetHidden + " .mat-icon", {timeout: 60000}).scrollIntoView();
      cy.get(tweetHidden + " .mat-icon").click({force: true});
      cy.get(menu2ndOpt, {timeout: 30000});
      cy.get(menu2ndOpt).contains("Unignore Tweet");
      cy.get(menu2ndOpt).click({force: true});
      cy.wait(500);
    }
  })
};

const testHide = (refresh, count, inc) => {

  cy.log("Ignoring");
  const tweetVisible = `.atr-${count}.atr-visible`;
  cy.get(".tweet-drawer", {timeout: 30000}).should("be.visible");
  cy.clickTweetTab(1);
  cy.get(tweetVisible, {timeout: 60000})
    .then(t => {
      if (t.find(".app-twitter-tweet").length > 0) {
        cy.get(tweetVisible + " .app-twitter-tweet", {timeout: 60000});
        cy.get(tweetVisible + " .app-twitter-tweet", {timeout: 60000}).scrollIntoView().should('be.visible');
        cy.get(tweetVisible).scrollIntoView();
        cy.get(tweetVisible + " .mat-icon", {timeout: 60000}).click({force: true}).get(menu2ndOpt).click({force: true});
      } else {
        cy.log("Skipping missing tweet " + count);
        inc();
      }
    });


};

describe('Testing #87 & #105', function () {

  beforeEach(() => {
    cy.stubLiveJson("live-old");
    cy.visit(url);
    cy.login();
    cy.visitAndWait(url);
    cy.log("Starting test.;")
  });

  afterEach(() => {
    cy.log("Cleaning up.");
    cy.logout();
  });


  it('Hidden Tweets Reappear : https://github.com/socialsensingbot/frontend/issues/87 : ', () => {
    cy.get(".tweet-drawer", {timeout: 30000});
    cy.log("Cleaning up.");
    cy.clickTweetTab(2);
    for (let i = 0; i < 40; i++) {
      testUnhide(false, i, false);
    }
    cy.log("Cleaned up.");
    let hideCount = 0;
    cy.clickTweetTab(1);
    for (let i = 0; i < 40; i++) {
      testHide(false, hideCount, () => hideCount++);
    }
    checkTabCounts(2);


  });
  it('More than 30 ignores fails : https://github.com/socialsensingbot/frontend/issues/105 : ', () => {
    cy.get(".tweet-drawer", {timeout: 30000});
    cy.log("Cleaning up.");
    cy.clickTweetTab(2);
    for (let i = 0; i < 80; i++) {
      testUnhide(false, i, false);
    }
    cy.log("Cleaned up.");
    let hideCount = 0;
    cy.clickTweetTab(1);
    for (let i = 0; i < 40; i++) {
      testHide(false, hideCount, () => hideCount++);
    }
    cy.withTweetCounts((vis1, hid1) => {
      expect(hid1).toBeGreaterThan(30);
    });
  });


});
