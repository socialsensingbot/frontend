import {BrowserModule} from "@angular/platform-browser";
import {ErrorHandler, NgModule} from "@angular/core";
import {AmplifyAngularModule, AmplifyService, AmplifyModules} from "aws-amplify-angular";
import Auth from "@aws-amplify/auth";
import Interactions from "@aws-amplify/interactions";
import Storage from "@aws-amplify/storage";

import {AppComponent} from "./app.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MaterialModule} from "./material/material.module";
import {AppRoutingModule} from "./app-routing.module";
import {MapComponent} from "./map/map.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SignUpComponent} from "./auth/sign-up/sign-up.component";
import {AuthComponent} from "./auth/auth.component";
import {CountryCodeSelectComponent} from "./auth/country-code-select/country-code-select.component";
import {FilterPipe} from "./auth/country-code-select/filter.pipe";
import {SignInComponent} from "./auth/sign-in/sign-in.component";
import {ConfirmCodeComponent} from "./auth/confirm-code/confirm-code.component";
import {AuthService} from "./auth/auth.service";
import {HomeComponent} from "./home/home.component";
import {LeafletModule} from "@asymmetrik/ngx-leaflet";
import {MatSliderModule} from "@angular/material/slider";
import {MatSidenavModule} from "@angular/material/sidenav";
import {TwitterPanelComponent} from "./map/twitter/twitter-panel.component";
import {DateRangeSliderComponent} from "./map/date-range-slider/date-range-slider.component";
import {Ng5SliderModule} from "ng5-slider";
import {LegendComponent} from "./map/legend/legend.component";
import {NewPassComponent} from "./auth/new-pass/new-pass.component";
import {HttpClientModule} from "@angular/common/http";
import {NgEventBus} from "ng-event-bus";
import {InfiniteScrollModule} from "ngx-infinite-scroll";
import {NgForageConfig} from "ngforage";
import {HelpButtonComponent} from "./help/help-button.component";
import {HelpSpanComponent} from "./help/help-span.component";
import {HelpDialogComponent} from "./help/help-dialog.component";
import {TweetListComponent} from "./map/twitter/tweet-list/tweet-list.component";
import {RollbarErrorHandler, rollbarFactory, RollbarService} from "./error";
import {SafeHtmlPipe} from "./safe.pipe";
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LayoutModule } from '@angular/cdk/layout';

@NgModule({
            declarations:    [
              SafeHtmlPipe,
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
              HelpSpanComponent,
              TweetListComponent,
              DashboardComponent
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
              LeafletModule.forRoot(),
              MatGridListModule,
              MatCardModule,
              MatMenuModule,
              MatIconModule,
              MatButtonModule,
              LayoutModule
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

            },
                              {
                                provide:  ErrorHandler,
                                useClass: RollbarErrorHandler
                              },

                              {
                                provide:    RollbarService,
                                useFactory: rollbarFactory
                              },
                              AuthService,
                              NgEventBus
            ],
            bootstrap:       [AppComponent],
            entryComponents: [CountryCodeSelectComponent, HelpDialogComponent]
          },)
export class AppModule {
  public constructor(ngfConfig: NgForageConfig) {
    ngfConfig.configure({});
  }
}
