import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {AuthComponent} from "./auth/auth.component";
import {MapComponent} from "./map/map.component";
import {SignInComponent} from "./auth/sign-in/sign-in.component";
import {SignUpComponent} from "./auth/sign-up/sign-up.component";
import {ConfirmCodeComponent} from "./auth/confirm-code/confirm-code.component";
import {AuthGuard} from "./auth/auth.guard";
import {UnauthGuard} from "./auth/unauth.guard";
import {HomeComponent} from "./home/home.component";
import {NewPassComponent} from "./auth/new-pass/new-pass.component";
import {DashboardComponent} from "./analytics/dashboard/dashboard.component";
import {AnalyticsComponent} from "./analytics/analytics.component";
import {TimeseriesAnalyticsComponent} from "./analytics/time/timeseries-analytics.component";
import {ResetPassComponent} from "./auth/reset-pass/reset-pass.component";
import {ForgotPassComponent} from "./auth/forgot-pass/forgot-pass.component";
import {PublicDisplayComponent} from "./public-display/public-display.component";

const routes: Routes = [
    {
        path: "auth", component: AuthComponent, children: [
            {
                path:        "signin",
                component:   SignInComponent,
                canActivate: [UnauthGuard]
            },
            {
                path:      "newpass",
                component: NewPassComponent
            },
            {
                path:        "resetpass",
                component:   ResetPassComponent,
                canActivate: [UnauthGuard]
            },
            {
                path:        "forgotpass",
                component:   ForgotPassComponent,
                canActivate: [UnauthGuard]
            },
            {
                path:        "signup",
                component:   SignUpComponent,
                canActivate: [UnauthGuard]
            },
            {
                path:        "confirm",
                component:   ConfirmCodeComponent,
                canActivate: [UnauthGuard]
            }
        ]
    },
    {path: "analytics/time", redirectTo: "map/uk-flood-live/analytics/time", pathMatch: "full"},
    {path: "dashboard", redirectTo: "map/uk-flood-live/dashboard", pathMatch: "full"},
    {path: "map", redirectTo: "map/uk-flood-live", pathMatch: "full"},
    {
        path: "map/:map", component: MapComponent, canActivate: [AuthGuard],
    },
    {
        path:     "map/:map/analytics", component: AnalyticsComponent, canActivate: [AuthGuard],
        children: [
            {path: "time", component: TimeseriesAnalyticsComponent, canActivate: [AuthGuard]},
            {path: "time/:id", component: TimeseriesAnalyticsComponent, canActivate: [AuthGuard]}
        ]
    },
    {path: "map/:map/dashboard", component: DashboardComponent, canActivate: [AuthGuard]},
    {path: "map/:map/display", component: PublicDisplayComponent, canActivate: [AuthGuard]},
    {path: "map/:map/display/:script", component: PublicDisplayComponent, canActivate: [AuthGuard]},
    {path: "", component: HomeComponent, canActivate: [AuthGuard]}
];

@NgModule({
              imports: [RouterModule.forRoot(routes, {relativeLinkResolution: "legacy"})],
              exports: [RouterModule]
          })
export class AppRoutingModule {
}
