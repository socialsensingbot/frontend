describe('01 Authentication:', function () {
  // Step 1: setup the application state
  beforeEach(function () {
    cy.visit('http://localhost:4200/map');
  });

  describe('Sign In:', () => {
    it('allows a user to signin', () => {
      //Login
      cy.login();
      cy.url().should("include", 'http://localhost:4200/map');
      //Logout
      cy.logout();
      cy.wait(4000);
      cy.url().should("include", 'http://localhost:4200/auth/signin');
      //Log back in
      cy.login();
      cy.url().should("include", 'http://localhost:4200/map');
    });
  });

});
