import {MAP_URL} from "../../../support";

const url = MAP_URL + "?selected=carmarthenshire&min_offset=-5399&max_offset=0&lat=53.00817326643286&lng=-2.0104980468750004&active_number=stats&active_polygon=county";

const testUnhide = (refresh, count, fail) => {
  cy.log("Un-ignoring " + count);

  const tweetHidden = ".atr-0.atr-hidden";
  cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
  cy.get(".app-tweet-drawer", {timeout: 30000}).then(drawer => {
    if (!fail && drawer.find(tweetHidden).length === 0) {
      cy.log("Skipping non existent tweet");
    } else {
      cy.get(tweetHidden).scrollIntoView().should('be.visible');
      cy.unignoreTweet(tweetHidden);
      cy.wait(1000);
    }
  })
};

const testHide = (refresh, count) => {

  cy.log("Ignoring");
  const tweetVisible = `.atr-visible .app-tweet-item`;
  cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
  cy.clickTweetTab(1);
  cy.get(tweetVisible, {timeout: 60000})
    .then(t => {
      const index = t.first().parents(".atr-visible").attr("data-index");
      cy.get(`.atr-visible.atr-${index}`, {timeout: 60000}).scrollIntoView().should('be.visible');
      cy.ignoreTweet(`.atr-visible.atr-${index}`);
      cy.wait(1000);
    });


};

describe('#94 Group Ignore Prefs : https://github.com/socialsensingbot/frontend/issues/94 :', function () {

  beforeEach(() => {
    cy.stubLiveJson("live-old");

  });

  afterEach(() => {
    cy.log("Cleaning up.");
    cy.logout();
  });


  it('Reproduce issue ', () => {
    cy.visit(url);
    cy.login("cypress1@example.com");
    cy.wait(1000);

    cy.get(".app-tweet-drawer", {timeout: 30000});

    cy.log("Cleaning up.");
    cy.clickTweetTab(2);
    for (let i = 0; i < 10; i++) {
      testUnhide(false, i, false);
    }
    cy.log("Cleaned up.");


    cy.visitAndWait(url);
    cy.log("Starting test.");

    let hideCount = 0;
    cy.clickTweetTab(1);
    for (let i = 0; i < 5; i++) {
      testHide(false, i);
    }
    cy.wait(1000);
    cy.withTweetCounts((vis1, hid1) => {
      cy.logout();
      cy.wait(1000);
      cy.login("cypress2@example.com");
      cy.visitAndWait(url);
      cy.wait(1000);
      cy.get(".app-tweet-drawer", {timeout: 30000});
      cy.withTweetCounts((vis2, hid2) => {
        cy.log("Testing for the same hidden and visible counts after account switch to cypress2@example.com.")
        expect(vis1).equals(vis2);
        expect(hid1).equals(hid2);
      });

    });
    cy.wait(1000);
    cy.withTweetCounts((vis1, hid1) => {
      cy.logout();
      cy.wait(500);
      cy.login("cypress3@example.com");
      cy.visitAndWait(url);
      cy.wait(1000);
      cy.get(".app-tweet-drawer", {timeout: 30000});
      cy.withTweetCounts((vis2, hid2) => {
        cy.log("Testing for the different hidden and visible counts after account switch to cypress3@example.com.")
        expect(vis1).to.not.equal(vis2);
        expect(hid1).to.not.equal(hid2);
      });

    });

  });


});
