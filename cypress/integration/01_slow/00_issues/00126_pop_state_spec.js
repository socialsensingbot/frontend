import {MAP_URL} from "../../../support";

describe('#126 Pop state : https://github.com/socialsensingbot/frontend/issues/126',
         function () {
             beforeEach(function () {
                 cy.visit('http://localhost:4200/map');
                 cy.stubLiveJson("live-02-06-2020");
                 cy.login();
             });

             it('Reproduce Issue', () => {
                 const url = MAP_URL + "?max_time=1631664000000&min_time=1631354400000&active_number=exceedance&active_polygon=county&selected=greater%20london";
                 const slideLeftUrl = MAP_URL + "?max_time=1631664000000&min_time=1631498400000&active_number=exceedance&active_polygon=county&selected=greater%20london";
                 cy.visitAndWait(url);
                 cy.tweetCountTotal(193);
                 cy.url({timeout: 20000}).should("equal", url);
                 cy.log("Click out of London in any other county");
                 cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-cambridgeshire").click();
                 cy.wait(10000);
                 cy.twitterPanelHeader("Cambridgeshire");
                 cy.tweetCountTotal(20);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?max_time=1631664000000&min_time=1631354400000&active_number=exceedance&active_polygon=county&selected=cambridgeshire");
                 cy.log("Go back into London.");
                 cy.go('back');
                 cy.wait(10000);
                 cy.twitterPanelHeader("Greater London");
                 cy.tweetCountTotal(193);
                 cy.url({timeout: 20000}).should("equal", url);
                 cy.log("Set slider to the left 3 times");
                 cy.moveMinDateSliderRight(4, true);
                 cy.wait(4000);
                 cy.tweetCountTotal(177);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.log("Now let's go back and forward.")
                 cy.go(-1);
                 cy.wait(10000);
                 cy.url({timeout: 20000}).should("equal",
                                                 MAP_URL + "?max_time=1631664000000&min_time=1631462400000&active_number=exceedance&active_polygon=county&selected=greater%20london");
                 cy.tweetCountTotal(181);
                 cy.go(+1);
                 cy.wait(10000);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.tweetCountTotal(177);
                 cy.go(-4);
                 cy.wait(10000);
                 cy.tweetCountTotal(193);
                 cy.url({timeout: 20000}).should("equal",
                                                 url);
                 cy.go(4);
                 cy.wait(4000);
                 cy.url({timeout: 20000}).should("equal",
                                                 slideLeftUrl);
                 cy.tweetCountTotal(177);


             });


         });
