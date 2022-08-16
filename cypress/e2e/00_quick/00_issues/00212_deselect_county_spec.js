import {MAP_URL, MAX_DATE_MILLIS, MIN_DATE_MILLIS} from "../../../support/e2e";

const zoomDuration = 1000;
describe('#212 Deselect by clicking on non-region: : https://github.com/socialsensingbot/frontend/issues/212',
         function () {
             describe('select county', () => {
                 const url = MAP_URL + "?selected=powys&active_number=exceedance&active_polygon=county&max_time=1631664000000&min_time=1631059200000&max_range_time=" + MAX_DATE_MILLIS + "&min_range_time=" + MIN_DATE_MILLIS;
                 it('when unauthorized and load state', () => {
                     cy.visit(url);
                     cy.login();
                     cy.visitAndWait(url);
                     cy.url({timeout: 30000}).should("equal", url);
                     cy.noSpinner();
                     cy.get(".leaflet-overlay-pane svg g path[stroke-width=3]", {timeout: 20000});
                     cy.wait(2000);
                     cy.get(".map").click(128, 128);
                     cy.wait(2000);
                     cy.url({timeout: 30000}).should("not.contain", "powys");
                     cy.logout();
                 });

             });

         });
