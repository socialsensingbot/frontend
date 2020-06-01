import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import {AmplifyAngularModule, AmplifyService, AmplifyModules} from 'aws-amplify-angular';
import Auth from '@aws-amplify/auth';
import Interactions from '@aws-amplify/interactions';
import Storage from '@aws-amplify/storage';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from './material/material.module';
import {AppRoutingModule} from './app-routing.module';
import {MapComponent} from './map/map.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SignUpComponent} from './auth/sign-up/sign-up.component';
import {AuthComponent} from './auth/auth.component';
import {CountryCodeSelectComponent} from './auth/country-code-select/country-code-select.component';
import {FilterPipe} from './auth/country-code-select/filter.pipe';
import {SignInComponent} from './auth/sign-in/sign-in.component';
import {ConfirmCodeComponent} from './auth/confirm-code/confirm-code.component';
import {AuthService} from './auth/auth.service';
import {Router} from "@angular/router";
import {HomeComponent} from "./home/home.component";
import {LeafletModule} from '@asymmetrik/ngx-leaflet';
import {MatSliderModule} from "@angular/material/slider";
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {TwitterPanelComponent} from './map/twitter/twitter-panel.component';
import {DateRangeSliderComponent} from './map/date-range-slider/date-range-slider.component';
import {Ng5SliderModule} from "ng5-slider";
import {LegendComponent} from './map/legend/legend.component';
import {NewPassComponent} from "./auth/new-pass/new-pass.component";
import {HttpClientModule} from "@angular/common/http";
import {NgEventBus} from "ng-event-bus";
import {NotificationService} from "./services/notification.service";
import {InfiniteScrollModule} from "ngx-infinite-scroll";
import {NgForageConfig, NgForageModule} from "ngforage";
import {HelpButtonComponent} from './help/help-button.component';
import {HelpSpanComponent} from "./help/help-span.component";
import {HelpDialogComponent} from './help/help-dialog.component';

export class NotificationErrorHandler implements ErrorHandler {
  constructor(private _notify: NotificationService) {}

  handleError(e: Error) {
    this._notify.error(e);
  }
}

@NgModule({
            declarations:    [
              AppComponent,
              MapComponent,
              SignUpComponent,
              AuthComponent,
              CountryCodeSelectComponent,
              FilterPipe,
              SignInComponent,
              ConfirmCodeComponent,
              HomeComponent,
              TwitterPanelComponent,
              DateRangeSliderComponent,
              NewPassComponent,
              LegendComponent,
              HelpButtonComponent,
              HelpDialogComponent,
              HelpSpanComponent
            ],
            imports:         [
              BrowserModule,
              HttpClientModule,
              BrowserAnimationsModule,
              AmplifyAngularModule,
              MaterialModule,
              MatSidenavModule,
              MatSliderModule,
              AppRoutingModule,
              FormsModule,
              ReactiveFormsModule,
              Ng5SliderModule,
              InfiniteScrollModule,
              LeafletModule.forRoot()
            ],
            providers:       [{
              provide: AmplifyService,

              useFactory: () => {
                return AmplifyModules({
                                        Auth,
                                        Storage,
                                        Interactions
                                      });
              },

            }, {
              provide:  ErrorHandler,
              useClass: NotificationErrorHandler,
            },
                              AuthService, NgEventBus],
            bootstrap:       [AppComponent],
            entryComponents: [CountryCodeSelectComponent, HelpDialogComponent]
          },)
export class AppModule {
  public constructor(ngfConfig: NgForageConfig) {
    ngfConfig.configure({});
  }
}
