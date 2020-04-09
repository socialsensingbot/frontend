describe('URL State: ', function () {

  describe('select county', () => {
    it('when unauthorized and preserve state', () => {
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.login();
      cy.url().should("equal","http://localhost:4200/map?selected=powys");
      cy.get("path[stroke-width='3']",{timeout:20000});
      /*
       * <path class="leaflet-interactive" stroke="#ea1e63" stroke-opacity="1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="#FB6A4A" fill-opacity="1" fill-rule="evenodd" d="M593 738L588 753L591 752L590 751L592 751L593 749L595 751L593 755L589 755L584 758L584 761L586 761L592 766L596 766L594 768L594 771L597 772L594 772L592 774L589 780L591 780L588 782L590 783L589 786L591 789L590 796L593 800L591 801L592 802L584 806L582 805L579 807L575 804L567 810L564 808L561 808L561 810L559 810L559 803L562 800L561 798L565 789L560 782L560 773L561 768L565 766L559 759L561 754L557 756L556 751L552 750L556 747L556 743L558 741L562 742L563 740L567 739L568 730L572 727L573 728L579 725L581 727L584 727L585 725L587 725L589 727L587 729L587 733L591 733L590 734L592 735L593 734L593 736L596 737L595 739L594 738z"></path>
       */
      cy.logout();
    });

  /* it('when authorized and preserve state', () => {
      cy.visit("http://localhost:4200/map");
      cy.login();
      cy.visit("http://localhost:4200/map?selected=powys");
      cy.url().should("equal","http://localhost:4200/map?selected=powys");
      cy.get("path[stroke-width='3']",{timeout:20000});

      cy.logout();
    });
  });*/


});
