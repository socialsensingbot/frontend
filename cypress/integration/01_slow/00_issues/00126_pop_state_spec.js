describe('#126 Pop state : https://github.com/socialsensingbot/frontend/issues/126',
         function () {
           beforeEach(function () {
             cy.visit('http://localhost:4200/map');
             cy.stubLiveJson("live-02-06-2020");
             cy.login();
           });

           it('Reproduce Issue', () => {
             const url = "http://localhost:4200/map?selected=greater%20london&max_time=1591100940000&min_time=1591007520000&active_number=stats&active_polygon=county";
             const slideLeftUrl = "http://localhost:4200/map?selected=greater%20london&max_time=1591100940000&min_time=1590899520000&active_number=stats&active_polygon=county";
             cy.visitAndWait(url);
             cy.tweetCountTotal(49);
             cy.log("Click out of London in any other county");
             cy.get("div.leaflet-pane.leaflet-overlay-pane > svg > g > path.x-feature-name-tipperary").click();
             cy.wait(1000);
             cy.twitterPanelHeader("Tipperary");
             cy.tweetCountTotal(1);
             cy.log("Go back into London.");
             cy.go('back');
             cy.twitterPanelHeader("Greater London");
             cy.tweetCountTotal(49);
             cy.url({timeout: 20000}).should("equal", url);
             cy.log("Set slider to the left 3 times");
             cy.moveMinDateSliderLeft(3);
             cy.wait(4000);
             cy.tweetCountTotal(101);
             cy.url({timeout: 20000}).should("equal",
                                             slideLeftUrl);
             cy.log("Now let's go back and forward.")
             cy.go('back');
             cy.wait(4000);
             cy.url({timeout: 20000}).should("equal",
                                             "http://localhost:4200/map?selected=greater%20london&max_time=1591100940000&min_time=1590935520000&active_number=stats&active_polygon=county");
             cy.tweetCountTotal(90);
             cy.go('forward');
             cy.wait(4000);
             cy.url({timeout: 20000}).should("equal",
                                             slideLeftUrl);
             cy.tweetCountTotal(101);
             cy.go(-3);
             cy.wait(4000);
             cy.url({timeout: 20000}).should("equal",
                                             url);
             cy.tweetCountTotal(49);
             cy.go(3);
             cy.wait(4000);
             cy.url({timeout: 20000}).should("equal",
                                             slideLeftUrl);
             cy.tweetCountTotal(101);


           });


         });
