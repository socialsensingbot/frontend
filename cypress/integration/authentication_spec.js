describe('Authentication:', function() {
  // Step 1: setup the application state
  beforeEach(function() {
    cy.visit('http://localhost:4200/map');
  });

  describe('Sign In:', () => {
    it('allows a user to signin', () => {

      //Login
      cy.login();
      //Logout
      cy.logout();
      //Log back in
      cy.login();

    });
  });

});
