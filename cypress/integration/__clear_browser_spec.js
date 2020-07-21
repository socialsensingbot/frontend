/**
 * These tests test the change of data from the server.
 */
import {MAP_URL} from "../../support";

describe('CLEAR BROWSER', function () {

  it('Clear ir', () => {
    cy.window().then((win) => {
      win.indexedDB.deleteDatabase("ngForage");
    });
  });

});
