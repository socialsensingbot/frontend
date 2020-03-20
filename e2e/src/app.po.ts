import {browser, by, element} from 'protractor';

export class AppPage {
  navigateTo() {
    return browser.get(browser.baseUrl+"map") as Promise<any>;
  }

  getTitleText() {
    return element(by.css('app-root .content span')).getText() as Promise<string>;
  }

  login() {
    element(by.css('input[type=email]')).sendKeys('neil@mangala.co.uk');
    element(by.css('input[type=password]')).sendKeys('testacpass');
    element(by.css('.mat-button-base.mat-raised-button')).click();
  }

  hasMap() {
    return element(by.css('.leaflet-map-pane')).isPresent() as Promise<boolean>;
  }

  getEmailLogin() {
    /*<input _ngcontent-fag-c6="" autocomplete="email" class="mat-input-element mat-form-field-autofill-control cdk-text-field-autofill-monitored ng-dirty ng-valid ng-touched cdk-text-field-autofilled" formcontrolname="email" matinput="" placeholder="Email" required="" type="email" ng-reflect-required="" ng-reflect-name="email" ng-reflect-placeholder="Email" ng-reflect-type="email" id="mat-input-0" aria-invalid="false" aria-required="true">*/
    return element(by.css('input[type=email]')).getText() as Promise<string>;

  }
}
