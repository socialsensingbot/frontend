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
import "cypress-graphql-mock";

const LONG_TIMEOUT = 60000;
const menu2ndOpt = "body .mat-menu-item:nth-child(2)";

Cypress.Commands.add("login", () => {
  //Login
  cy.url({timeout: LONG_TIMEOUT}).should("contain", "auth/signin")
  cy.get('input[type=email]').type(Cypress.env("TEST_AC_USER"));
  cy.get('input[type=password]').type(Cypress.env("TEST_AC_PASS"));
  cy.get('.mat-button-base.mat-raised-button').contains('Sign In');
  cy.get('.mat-button-base.mat-raised-button').contains('Sign In').click();
  cy.url({timeout: LONG_TIMEOUT}).should("not.contain", "auth/signin")
});

Cypress.Commands.add("logout", () => {
  cy.get('#logout').click();
});

Cypress.Commands.add("visitAndWait", (url) => {
  cy.visit(url);
  cy.url({timeout: 20000}).should("equal", url);
  cy.noSpinner();
});


Cypress.Commands.add("noSpinner", () => {
  cy.get('.map');
  cy.get("mat-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.get('body').should(el => {
    if (el) {
      if (el.find("mat-spinner").length > 0) {
        cy.get("mat-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
      } else {
      }
    } else {
    }
  });
});

Cypress.Commands.add("twitterPanelHeader", (text) => {
  cy.get("twitter-panel");
  cy.get(".app-tweet-area-loading-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.wait(1000);
  cy.get(".app-tweet-area-loading-spinner", {timeout: LONG_TIMEOUT}).should("not.be.visible");
  cy.get(".app-tweet-heading", {timeout: LONG_TIMEOUT});
  cy.get("span.app-tweet-heading", {timeout: LONG_TIMEOUT}).should("contain.text", text);
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
  cy.get(".mat-tab-label:nth-child(1)").then(header => {
    const headerParts = header.text().trim().split(" ");
    const visibleCount = +headerParts[0];
    cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000})
      .then(title => {
              const hiddenCount = +title.text().trimLeft().split(" ")[0];
              expect(hiddenCount + visibleCount).equals(sum);
            }
      );

  })
});

Cypress.Commands.add("withTweetCounts", (callback) => {
  cy.get(".mat-tab-label:nth-child(1)").then(header => {
    const headerParts = header.text().trim().split(" ");
    const visibleCount = +headerParts[0];
    cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000})
      .then(title => {
              const hiddenCount = +title.text().trimLeft().split(" ")[0];
              callback(visibleCount, hiddenCount);
            }
      );

  })
});


Cypress.Commands.add("tweetCount", (vis, hid) => {
  cy.get(".mat-tab-label:nth-child(1)").then(header => {
    const headerParts = header.text().trim().split(" ");
    const visibleCount = +headerParts[0];
    const totalCount = vis + hid;
    cy.get(".app-tweet-outer").find('.atr-visible').its('length').should('eq', vis);

    cy.get(".mat-tab-label:nth-child(2)", {timeout: 30000}).click()
      .then(title => {
              const hiddenCount = +title.text().trimLeft().split(" ")[0];
        cy.get(".app-tweet-outer").find('.atr-hidden').its('length').should('eq', hid);

            }
      );

  })
});


Cypress.Commands.add("clickTweetTab", (index) => {
  cy.get(`.mat-tab-label:nth-child(${index})`, {timeout: 30000}).click({force: true});
});

Cypress.Commands.add("ignoreTweet", (tweetSelector) => {
  cy.get(tweetSelector + " .mat-icon", {timeout: 4000})
  cy.get(tweetSelector + " .mat-icon").trigger("click", {force: true});
  cy.get(menu2ndOpt, {timeout: 30000});
  cy.get(menu2ndOpt).contains("Ignore Tweet");
  cy.get(menu2ndOpt).click({force: true});

});

Cypress.Commands.add("unignoreTweet", (tweetSelector) => {
  cy.get(tweetSelector + " .mat-icon", {timeout: 4000})
  cy.get(tweetSelector + " .mat-icon").trigger("click", {force: true});
  cy.get(menu2ndOpt, {timeout: 30000});
  cy.get(menu2ndOpt).contains("Unignore Tweet");
  cy.get(menu2ndOpt).click({force: true});

});


Cypress.Commands.add("moveMinDateSliderLeft", (times) => {
  for (let i = 0; i < times; i++) {
    cy.get(".ng5-slider-pointer-min").type('{pagedown}');
    cy.wait(1000);
  }
});

Cypress.Commands.add("moveMinDateSliderRight", (times) => {
  for (let i = 0; i < times; i++) {
    cy.get(".ng5-slider-pointer-min").type('{pageup}');
    cy.wait(1000);
  }
});

Cypress.Commands.add("pushStateDelay", () => {
  cy.wait(500);
});
Cypress.Commands.add("stubLiveJson", (file) => {
  // Alternatively you can use CommonJS syntax:
// require('./commands')
// sets up cy.server, so cypress knows to
// prepare network responses
  cy.server();
// this is where we tell cypress to intercept
// certain XHR calls,
// and to stub in our fixture instead
  cy.route({
             // our example is a GET call, but you could also
             // have a POST, if you're pushing data up
             method:   "GET",
             // more on the URL below
             url:      /.*\/public\/live.json?.*/g,
             // the fixture: shortcut will know to
             // look in cypress/fixtures,
             // unless you configure cypress to
             // put it somewhere else
             response: "fixture:" + file + ".json"
           });

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
  cy.server({

              onAnyRequest: (route, proxy) => {

                if (!route || !route.url || typeof route.url["indexOf"] === "undefined") {
                  return;
                }
                const {xhr} = proxy;
                if (route.url.indexOf('/graphql') >= 0) {
                  const {body} = proxy.request;
                  if (body && body.query && body.query.indexOf(
                    "ListTweetIgnores") >= 0) {
                    route.response = {
                      "data": {
                        "listTweetIgnores": {
                          items: []
                        }
                      }
                    };


                  }

                  if (body && body.query && body.query.indexOf(
                    "ListTwitterUserIgnores") >= 0) {
                    route.response = {
                      "data": {
                        "listTwitterUserIgnores": {
                          items: []
                        }

                      }
                    };

                  }
                  if (body && body.query && body.query.indexOf(
                    "GetUserPreferences") >= 0) {
                    console.log("GetUserPreferences");
                    route.response = {
                      "data": {
                        "getUserPreferences": {
                          "id":           "434fd82f-3a65-4c66-85c1-b701f2b7ca81",
                          "ignoreTweets": {
                            "nextToken": null
                          },
                          "ignorePeople": {
                            "nextToken": null
                          },
                          "irrelevant":   {
                            "nextToken": null
                          },
                          "owner":        "434fd82f-3a65-4c66-85c1-b701f2b7ca81"
                        }
                      }
                    };


                  }

                }
                console.log("RESPONSE: ", route, proxy);
              }

            });
  cy.route("POST", "/graphql", {});
});

