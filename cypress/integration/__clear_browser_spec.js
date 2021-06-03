/**
 * These tests test the change of data from the server.
 */

describe('CLEAR BROWSER', function () {

  it('Clear ir', () => {
    cy.window().then((win) => {
      win.indexedDB.deleteDatabase("ngForage");
    });
  });

});
