import {
    LONDON_TWEET,
    LONDON_TWEET_HIDDEN,
    LONDON_TWEET_HIDDEN_MENU,
    LONDON_TWEET_VISIBLE,
    LONDON_TWEET_VISIBLE_MENU,
    LONDON_URL
} from "../../support/e2e";
import {markAsIgnoredMenu, markAsMenu, markAsUnignoredMenu} from "../../support/commands";

describe('03 Ignore tweets: ', function () {
    beforeEach(() => {
    })

    const url = LONDON_URL;
    const test = () => {
        cy.visit(url);
        cy.login();
        cy.visitAndWait(url);
        cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
        cy.get(".app-tweet-table", {timeout: 30000}).then(panel => {
            if (panel.find(LONDON_TWEET).length > 0) {
                cy.get(LONDON_TWEET_VISIBLE, {timeout: 60000});
                cy.get(LONDON_TWEET_VISIBLE, {timeout: 60000}).should('be.visible');
                cy.get(LONDON_TWEET_VISIBLE + " .app-tweet-item", {timeout: 60000});
                cy.get(LONDON_TWEET_VISIBLE + " .app-tweet-item", {timeout: 60000}).should('be.visible');
                cy.get(LONDON_TWEET_VISIBLE_MENU, {timeout: 60000}).click({force: true});
                cy.wait(1000);
                cy.get(markAsMenu).click();
                cy.wait(1000);
                cy.get(markAsIgnoredMenu).click();
                cy.get("#mat-tab-label-1-1", {timeout: 30000}).click();
                cy.wait(4000);
                cy.get(LONDON_TWEET_HIDDEN, {timeout: 60000});
                cy.get(LONDON_TWEET_HIDDEN + " .app-tweet-item", {timeout: 60000});
                cy.get(LONDON_TWEET_HIDDEN_MENU, {timeout: 30000}).click({force: true});
                cy.get(markAsMenu).click();
                cy.wait(1000);
                cy.get(markAsUnignoredMenu).contains("Unignored Tweet");
            } else {
                cy.get("#mat-tab-label-1-1", {timeout: 30000}).click({force: true});
                cy.get(LONDON_TWEET_HIDDEN_MENU, {timeout: 60000}).click({force: true});
                cy.wait(1000);
                cy.get(markAsMenu).click();
                cy.wait(1000);
                cy.get(markAsUnignoredMenu).click();
                cy.wait(4000);
                cy.get("#mat-tab-label-1-0", {timeout: 30000}).click({force: true});
                cy.get(LONDON_TWEET_VISIBLE_MENU, {timeout: 30000}).click({force: true});
                cy.get(markAsMenu).click();
                cy.wait(1000);
                cy.get(markAsIgnoredMenu).contains("Ignored Tweet");
            }
        });
    };
    it('toggle tweet', test);
    it('toggle tweet again', test);


});
