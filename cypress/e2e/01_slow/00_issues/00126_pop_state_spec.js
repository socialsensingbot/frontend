import {MAP_URL} from "../../../support/e2e";

describe('#126 Pop state : https://github.com/socialsensingbot/frontend/issues/126',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.stubLiveJson("live-02-06-2020");
                 cy.login();
             });

             it('Reproduce Issue', () => {
                 const url = MAP_URL + "?max_time=1631664000000&min_time=1631354400000&active_number=exceedance&active_polygon=county&selected=greater%20london";
                 const slideLeftUrl = MAP_URL + "?max_time=1631664000000&min_time=1631599200000&active_number=exceedance&active_polygon=county&selected=greater%20london";
                 cy.visitAndWait(url);
                 cy.get(".app-tweet-drawer", {timeout: 30000}).should("be.visible");
                 cy.get(".app-tweet-table", {timeout: 30000});
                 cy.wait(10000);
                 cy.tweetCountTotal(387);
                 cy.url({timeout: 20000}).should("equal", url);
                 cy.log("Click out of London in any other county");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-cambridgeshire").click();
                 cy.wait(10000);
                 cy.twitterPanelHeader("Cambridgeshire");
                 cy.wait(2000);
                 cy.tweetCountTotal(56);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?max_time=1631664000000&min_time=1631354400000&active_number=exceedance&active_polygon=county&selected=cambridgeshire");
                 cy.log("Go back into London.");
                 cy.go('back');
                 cy.wait(10000);
                 cy.twitterPanelHeader("Greater London");
                 cy.wait(2000);
                 cy.tweetCountTotal(387);
                 cy.url({timeout: 20000}).should("equal", url);
                 cy.log("Set slider to the left 3 times");
                 cy.moveMinDateSliderRight(4, true);
                 cy.wait(5000);
                 cy.tweetCountTotal(348);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.log("Now let's go back and forward.")
                 cy.go(-1);
                 cy.wait(5000);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?max_time=1631664000000&min_time=1631538000000&active_number=exceedance&active_polygon=county&selected=greater%20london");
                 cy.tweetCountTotal(358);
                 cy.go(+1);
                 cy.wait(5000);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.tweetCountTotal(348);
                 cy.go(-4);
                 cy.wait(5000);
                 cy.tweetCountTotal(387);
                 cy.url({timeout: 20000}).should("equal",
                                                 url);
                 cy.go(4);
                 cy.wait(5000);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.tweetCountTotal(348);


             });


         });
