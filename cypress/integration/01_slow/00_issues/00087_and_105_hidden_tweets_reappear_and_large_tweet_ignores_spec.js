import {LONDON_URL} from "../../../support";

const url = LONDON_URL;


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
    cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
    cy.get(".app-tweet-drawer", {timeout: 30000}).then(drawer => {
        if (!fail && drawer.find(tweetHidden).length === 0) {
            cy.log("Skipping non existent tweet");
        } else {
            cy.get(tweetHidden).scrollIntoView().should('be.visible');
            cy.unignoreTweet(tweetHidden);
            cy.wait(2000);
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
            cy.wait(2000);
        });


};

describe('#87 & #105', {
    retries: {
        runMode:  8,
        openMode: 1,
    }
}, function () {

    beforeEach(() => {
        cy.visit(url);
        cy.login("cypress1@example.com");
        cy.visitAndWait(url);
        cy.log("Starting test.;")
    });

    afterEach(() => {
        cy.log("Cleaning up.");
        cy.logout();
    });


    it('#87 Hidden Tweets Reappear : https://github.com/socialsensingbot/frontend/issues/87 : ', () => {
        cy.get(".app-tweet-drawer", {timeout: 30000});
        cy.log("Cleaning up.");
        cy.clickTweetTab(2);
        for (let i = 0; i < 10; i++) {
            testUnhide(false, i, false);
        }
        cy.log("Cleaned up.");
        let hideCount = 0;
        cy.clickTweetTab(1);
        for (let i = 0; i < 10; i++) {
            testHide(false, i);
        }
        checkTabCounts(2);


    });
    /*
    it('More than 30 ignores fails : https://github.com/socialsensingbot/frontend/issues/105 : ', () => {
      Cypress.currentTest.retries(5);
      cy.get(".app-tweet-drawer", {timeout: 30000});
      cy.log("Cleaning up.");
      cy.clickTweetTab(2);
      for (let i = 0; i < 32; i++) {
        testUnhide(false, i, false);
      }
      cy.log("Cleaned up.");
      let hideCount = 0;
      cy.clickTweetTab(1);
      for (let i = 0; i < 45; i++) {
        testHide(false, i);
      }
      cy.withTweetCounts((vis1, hid1) => {
        expect(hid1).toBeGreaterThan(30);
      });
    });*/


});
