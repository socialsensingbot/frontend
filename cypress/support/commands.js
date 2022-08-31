// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import {parse} from 'csv-parse/lib/sync';

const LONG_TIMEOUT = 60000;
const VERY_LONG_TIMEOUT = 120000;
const menu2ndOpt = "body .mat-menu-item:nth-child(2)";
const multipleKey = Cypress.platform === "darwin" ? "{command}" : "{ctrl}";
export const markAsIgnoredMenu = ".tweet-menu-ignore-tweet";
export const markAsUnignoredMenu = ".tweet-menu-unignore-tweet";
export const markAsMenu = ".tweet-list-item-menu-mark-as";


const noLoadingDiv = () => {

    cy.get("#loading-div", {timeout: VERY_LONG_TIMEOUT}).should("not.exist");

};

const elNotVisible = (selector) => {
    cy.get('body').then(($body) => {
        let el = $body.find(selector);
        if (el.length) {
            cy.get(selector, {timeout: LONG_TIMEOUT}).should("not.be.visible");
        }
    });
};


const noTweetLoadingSpinner = function () {
    elNotVisible(".app-tweet-area-loading-spinner");
};

Cypress.Commands.add("login", (username = "cypress1@example.com") => {
    //Login
    cy.url({timeout: LONG_TIMEOUT}).should("contain", "auth/signin");
    noLoadingDiv();
    cy.get('input[type=email]').type(username);
    cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
    cy.get('.mat-button-base.mat-raised-button').contains('Sign In');
    cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();
    cy.url({timeout: LONG_TIMEOUT}).should("not.contain", "auth/signin")
});

Cypress.Commands.add("logout", () => {
    noLoadingDiv();
    cy.get('#logout').click();
});

Cypress.Commands.add("visitAndWait", (url) => {
    cy.visit(url, {
        onBeforeLoad(win) {
            // cy.spy(win.console, 'info').as('consoleLog')
            cy.spy(win.console, 'error').as('consoleError')
            cy.spy(win.console, 'warn').as('consoleWarn')
        }
    });
    cy.url({timeout: 20000}).should("equal", url);
    cy.noSpinner();
});


Cypress.Commands.add("visitAndErrorCheck", (url) => {
    cy.visit(url, {
        onBeforeLoad(win) {
            // cy.spy(win.console, 'info').as('consoleLog')
            cy.spy(win.console, 'error').as('consoleError')
            cy.spy(win.console, 'warn').as('consoleWarn')
        }
    });
});


Cypress.Commands.add("noSpinner", () => {
    cy.get('.map');
    noLoadingDiv();
    cy.get('body').should(el => {
        if (el) {
            if (el.find(".map-spinner").length > 0) {
                cy.get(".map-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
            } else {
            }
        } else {
        }
    });
});

Cypress.Commands.add("twitterPanelHeader", (text, subheadingText) => {
    noLoadingDiv();
    cy.get("twitter-panel");
    noTweetLoadingSpinner();
    cy.wait(1000);
    noTweetLoadingSpinner();
    cy.get(".app-tweet-heading", {timeout: LONG_TIMEOUT});
    cy.wait(1000);
    cy.get(".app-tweet-heading", {timeout: LONG_TIMEOUT}).should("contain.text", text);
    if (subheadingText) {
        cy.get(".app-tweet-sub-heading", {timeout: LONG_TIMEOUT});
        cy.get(".app-tweet-sub-heading", {timeout: LONG_TIMEOUT}).should("contain.text", subheadingText);
    }
});
Cypress.Commands.add("twitterPanelVisible", () => {
    cy.get(".app-tweet-drawer", {timeout: LONG_TIMEOUT}).should("be.visible");
});

Cypress.Commands.add("twitterPanelNotVisible", () => {
    cy.get(".app-tweet-drawer", {timeout: LONG_TIMEOUT}).should("not.be.visible");
});
Cypress.Commands.add("tweetsVisible", (count) => {
    cy.get("twitter-panel").find('.app-tweet-paged .atr-visible .app-tweet-item',
                                 {timeout: LONG_TIMEOUT}).its('length').should(
        'eq',
        count);
});
Cypress.Commands.add("tweetCountTotal", (sum) => {
    cy.get(".app-tweet-visible-tweets-tab-label", {timeout: 30000}).then(header => {
        const headerParts = header.text().trim().split(" ");
        const visibleCount = +headerParts[0];
        cy.get(".app-tweet-hidden-tweets-tab-label", {timeout: 30000})
            .then(title => {
                      const hiddenCount = +title.text().trimLeft().split(" ")[0];
                      expect(hiddenCount + visibleCount).equals(sum);
                  }
            );

    })
});

Cypress.Commands.add("withTweetCounts", (callback) => {
    cy.wait(4000);
    cy.get(".app-tweet-visible-tweets-tab-label").then(header => {
        const headerParts = header.text().trim().split(" ");
        const visibleCount = +headerParts[0];
        cy.get(".app-tweet-hidden-tweets-tab-label", {timeout: 30000})
            .then(title => {
                      const hiddenCount = +title.text().trimLeft().split(" ")[0];
                      callback(visibleCount, hiddenCount);
                  }
            );

    })
});


Cypress.Commands.add("tweetCount", (vis, hid) => {
    cy.get("#mat-tab-label-1-0 > .mat-tab-label-content").then(header => {
        const headerParts = header.text().trim().split(" ");
        const visibleCount = +headerParts[0];
        const totalCount = vis + hid;
        cy.get(".app-tweet-outer").find('.atr-visible').its('length').should('eq', vis);

        cy.get("#mat-tab-label-1-1 > .mat-tab-label-content", {timeout: 30000}).click()
            .then(title => {
                      const hiddenCount = +title.text().trimLeft().split(" ")[0];
                      cy.get(".app-tweet-outer").find('.atr-hidden').its('length').should('eq', hid);

                  }
            );

    })
});


Cypress.Commands.add("clickTweetTab", (index) => {
    cy.get(`#mat-tab-label-1-${index - 1} > .mat-tab-label-content`, {timeout: 30000}).click({force: true});
});

Cypress.Commands.add("ignoreTweet", (tweetSelector) => {
    cy.wait(1000);
    cy.get(tweetSelector + " .app-tweet-item-menu", {timeout: 10000})
    cy.get(tweetSelector + " .app-tweet-item-menu").click();
    cy.wait(3000);
    cy.get(markAsMenu, {timeout: LONG_TIMEOUT}).click();
    cy.wait(1000);
    cy.get(markAsIgnoredMenu).click();

});

Cypress.Commands.add("unignoreTweet", (tweetSelector) => {
    cy.wait(1000);
    cy.get(tweetSelector + " .app-tweet-item-menu", {timeout: 10000});
    cy.get(tweetSelector + " .app-tweet-item-menu").click();
    cy.wait(3000);
    cy.get(markAsMenu, {timeout: LONG_TIMEOUT}).click();
    cy.wait(1000);
    cy.get(markAsUnignoredMenu).click();


});

Cypress.Commands.add("unhideTweets", (num) => {
    cy.clickTweetTab(2);
    for (let i = 0; i < num; i++) {
        const tweetHidden = ".atr-0.atr-hidden";
        cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
        cy.get(".app-tweet-drawer", {timeout: 30000}).then(drawer => {
            if (drawer.find(tweetHidden).length === 0) {
                cy.log("Skipping non existent tweet");
            } else {
                cy.get(tweetHidden).scrollIntoView().should('be.visible');
                cy.unignoreTweet(tweetHidden);
                cy.wait(500);
            }
        })
    }
    cy.clickTweetTab(1);
    cy.wait(2000);
});


Cypress.Commands.add("moveMinDateSliderLeft", (times, expectURLChange = false) => {
    for (let i = 0; i < times; i++) {
        cy.url().then(url => {
            cy.get(".ng5-slider-pointer-min").type('{pagedown}', {force: true});
            cy.log("Grace period to allow the URL to change")
            if (expectURLChange) {
                cy.url({timeout: 20000}).should("not.equal", url);
            } else {
                cy.wait(3000);
            }
        })
    }
});

Cypress.Commands.add("moveMinDateSliderRight", (times, expectURLChange = false) => {
    for (let i = 0; i < times; i++) {
        cy.url().then(url => {
            cy.get(".ng5-slider-pointer-min").type('{pageup}', {force: true});
            cy.log("Grace period to allow the URL to change")
            if (expectURLChange) {
                cy.url({timeout: 20000}).should("not.equal", url);
            } else {
                cy.wait(5000);
            }
        })
    }
});

Cypress.Commands.add("multiSelectRegions", (regions) => {
    for (let region of regions) {
        const path = `div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-${region}`;
        cy.get("body").type(multipleKey, {release: false, force: true})
        cy.get(path).click({force: true, multiple: true});
        cy.wait(1000);
        cy.get("body").type(multipleKey, {release: true, force: true})
    }
});
Cypress.Commands.add("pushStateDelay", () => {
    cy.wait(500);
});
Cypress.Commands.add("stubLiveJson", (map_data, analaytics_all = "timeseries-all") => {
    cy.log("stubLiveJson is no longer needed");

});

function patchXhrUsing(makeResponse) {
    return (rawResponse) => {
        console.log("RESPONSE:", rawResponse.xhr.response);
        const {xhr} = rawResponse;
        Object.defineProperty(xhr.__proto__, 'response', {writable: true});
        xhr.response = JSON.stringify(makeResponse(rawResponse));
        rawResponse.response = xhr.response;
        return rawResponse;
    }
}

Cypress.Commands.add("mockGraphQL", () => {
    throw new Error("DO NOT USE, THIS IS BROKEN");
    cy.server({
                  onAnyRequest: (route, proxy) => {

                      if (!route || !route.url || typeof route.url["indexOf"] === "undefined") {
                          return;
                      }
                      const {xhr} = proxy;
                      if (route.url.indexOf('/graphql') >= 0) {
                          const {body} = proxy.request;
                          if (body && body.query && body.query.indexOf(
                              "ListGroupTweetIgnores") >= 0) {
                              route.response = {
                                  "data": {
                                      "listGroupTweetIgnores": {
                                          items: []
                                      }
                                  }
                              };


                          } else if (body && body.query && body.query.indexOf(
                              "ListGroupTwitterUserIgnores") >= 0) {
                              route.response = {
                                  "data": {
                                      "listGroupTwitterUserIgnores": {
                                          items: []
                                      }

                                  }
                              };

                          } else if (body && body.query && body.query.indexOf(
                              "GetUserPreferences") >= 0) {
                              console.log("GetUserPreferences");
                              route.response = {
                                  "data": {
                                      "getUserPreferences": {
                                          "id":    "434fd82f-3a65-4c66-85c1-b701f2b7ca81",
                                          "owner": "434fd82f-3a65-4c66-85c1-b701f2b7ca81"
                                      }
                                  }
                              };


                          }

                      } else if (body && body.query && body.query.indexOf(
                          "ListDataSets") >= 0) {
                          route.response = {
                              "data": {
                                  "listDataSets": {
                                      items: [{id: "live", title: "Live"}]
                                  }

                              }
                          };

                      }
                      console.log("RESPONSE: ", route, proxy);
                  }

              });
    cy.route("POST", "/graphql");
});

const path = require('path')


/**
 * Delete the downloads folder to make sure the test has "clean"
 * slate before starting.
 */
const deleteDownloadsFolder = () => {
    const downloadsFolder = Cypress.config('downloadsFolder')

    cy.task('deleteFolder', downloadsFolder)
}

/*
export const validateCsvList = (list) => {
    expect(list, 'number of records').to.have.length(3)
    expect(list[0], 'first record').to.deep.equal({
                                                      Age:          '20',
                                                      City:         'Boston',
                                                      'First name': 'Joe',
                                                      'Last name':  'Smith',
                                                      Occupation:   'student',
                                                      State:        'MA',
                                                  })
}

*/

/**
 * @param {string} name File name in the downloads folder
 */
Cypress.Commands.add("validateCsvFile", (name, validateCsvList) => {
    const downloadsFolder = Cypress.config('downloadsFolder')
    const filename = path.join(downloadsFolder, name);
    cy.task('findFiles', filename).then((file) => {
        cy.readFile(file, 'utf8').then(str => validateCsvList(parse(str.charAt(0) === '\ufeff' ? str.substring(1,
                                                                                                               str.length) : str)));
    });
});


const Diff = require('diff');


Cypress.Commands.add("diff", (src, dest) => {
    const diff = Diff.diffChars(src, dest);

    let result = "DIFF: "
    diff.forEach((part) => {
        if (part.added) {
            result += ">>>" + part.value + ">>>\n"
        } else if (part.removed) {
            result += "<<<" + part.value + "<<<\n"
        } else {
        }
    });
    console.log(result);
    cy.log(result);
    expect(src).to.equal(dest);
});
