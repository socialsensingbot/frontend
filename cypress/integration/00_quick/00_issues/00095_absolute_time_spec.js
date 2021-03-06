import {MAP_URL} from "../../../support";

const zoomDuration = 1000;

function confirmSlider() {
  cy.get(".slider-date-time-min .slider-date", {timeout: 20000}).should("contain.text", "25-Apr-20");
  cy.get(".slider-date-time-min .slider-time").should("contain.text", "10 pm");
  cy.get(".slider-date-time-max .slider-date", {timeout: 20000}).should("contain.text", "26-Apr-20");
  cy.get(".slider-date-time-max .slider-time").should("contain.text", "10 pm");
}


describe('#95 App auto adjusts for past date in date range: : https://github.com/socialsensingbot/frontend/issues/95',
         () => {
           const url = MAP_URL + "?selected=powys&max_time=1587941160000&min_time=1587854760000&active_number=stats&active_polygon=county";
           it('when authorized and load state', () => {
             cy.visit("http://localhost:4200/map");
             cy.stubLiveJson("live-short");
             cy.login();
             cy.visitAndWait(url);
             cy.get(".slider-date-time", {timeout: 20000});
             cy.log(
               "The URL should auto update based on the latest data's latest time, adjusting the min and max offsets accordingly.");
             cy.url({timeout: 20000}).should("equal", url);
             confirmSlider();
             cy.get(".app-tweet-drawer", {timeout: 20000}).should("be.visible");
             cy.twitterPanelHeader("Powys");
             cy.log(
               "We now wait for a data update to occur, the date values on the slider *must not* change.")
             cy.stubLiveJson("live-long");
             cy.wait(65000)
             cy.url({timeout: 20000}).should("equal", url);
             confirmSlider();
             cy.log("We confirm the URL has the right information in it by reloading the page.")
             cy.reload();
             cy.get(".slider-date-time", {timeout: 20000});
             confirmSlider();

             cy.logout();
           });
         });



