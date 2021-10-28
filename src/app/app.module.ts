import {BrowserModule} from "@angular/platform-browser";
import {ErrorHandler, NgModule} from "@angular/core";
import {ClipboardModule} from "@angular/cdk/clipboard";
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
import {DashboardComponent} from "./analytics/dashboard/dashboard.component";
import {TimeSeriesChartComponent} from "./charts/timeseries-chart/timeseries-chart.component";
import {BarChartComponent} from "./charts/bar-chart/bar-chart.component";
import {PieChartComponent} from "./charts/pie-chart/pie-chart.component";
import {AmplifyUIAngularModule} from "@aws-amplify/ui-angular";
import {TweetCopyDialogComponent} from "./map/twitter/tweet-list/tweet-copy-dialog/tweet-copy-dialog.component";
import {StripHtmlPipe} from "./strip.pipe";
import {TimeSeriesMultiChartComponent} from "./charts/timeseries-multi-chart/timeseries-multi-chart.component";
import {MapGraphSidebarComponent} from "./map/map-graph-sidebar/map-graph-sidebar.component";
import {AnalyticsComponent} from "./analytics/analytics.component";
import {TimeseriesAnalyticsComponent} from "./analytics/time/timeseries-analytics.component";
import {TimeseriesAnalyticsFormComponent} from "./analytics/time/timeseries-analytics-form.component";
import {TimeSeriesMultipleQueryChartComponent} from "./analytics/time/timeseries-multi-chart/time-series-multiple-query-chart.component";
import {NameGraphDialogComponent} from "./analytics/time/name-graph-dialog/name-graph-dialog.component";
import {TimeseriesWidgetComponent} from "./analytics/widgets/twitter-timeseries/timeseries-widget.component";
import {ForgotPassComponent} from "./auth/forgot-pass/forgot-pass.component";
import {ResetPassComponent} from "./auth/reset-pass/reset-pass.component";
import {MAT_DATE_LOCALE} from "@angular/material/core";

@NgModule({
              declarations:    [
                  SafeHtmlPipe,
                  StripHtmlPipe,
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
                  DashboardComponent,
                  TweetListComponent,
                  TweetCopyDialogComponent,
                  TimeSeriesChartComponent,
                  BarChartComponent,
                  PieChartComponent,
                  TimeSeriesMultiChartComponent,
                  MapGraphSidebarComponent,
                  AnalyticsComponent,
                  TimeseriesAnalyticsComponent,
                  TimeseriesAnalyticsFormComponent,
                  TimeSeriesMultipleQueryChartComponent,
                  NameGraphDialogComponent,
                  TimeseriesWidgetComponent,
                    ForgotPassComponent,
                  ResetPassComponent
              ],
              imports:         [
                  BrowserModule,
                  HttpClientModule,
                  BrowserAnimationsModule,
                  AmplifyUIAngularModule,
                  MaterialModule,
                  MatSidenavModule,
                  MatSliderModule,
                  AppRoutingModule,
                  FormsModule,
                  ReactiveFormsModule,
                  Ng5SliderModule,
                  InfiniteScrollModule,
                  LeafletModule,
                  ClipboardModule
              ],
              providers:       [
                  {
                      provide:  ErrorHandler,
                      useClass: RollbarErrorHandler
                  },

                  {
                      provide:    RollbarService,
                      useFactory: rollbarFactory
                  },
                  AuthService,
                  NgEventBus,
                  {provide: MAT_DATE_LOCALE, useValue: 'en-GB'},
              ],
              bootstrap:       [AppComponent],
              entryComponents: [CountryCodeSelectComponent, HelpDialogComponent]
          }, )
export class AppModule {
    public constructor(ngfConfig: NgForageConfig) {
        ngfConfig.configure({});
    }
}
