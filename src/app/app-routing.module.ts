import {NgModule} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {AuthComponent} from "./auth/auth.component";
import {MapComponent} from "./map/map.component";
import {SignInComponent} from "./auth/sign-in/sign-in.component";
import {SignUpComponent} from "./auth/sign-up/sign-up.component";
import {ConfirmCodeComponent} from "./auth/confirm-code/confirm-code.component";
import {AuthGuard} from "./auth/auth.guard";
import {UnauthGuard} from "./auth/unauth.guard";
import {HomeComponent} from "./home/home.component";
import {NewPassComponent} from "./auth/new-pass/new-pass.component";

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
  {path: "map", component: MapComponent, canActivate: [AuthGuard]},
  {path: "map/:dataset", component: MapComponent, canActivate: [AuthGuard]},
  {path: "", component: HomeComponent, canActivate: [AuthGuard]}
];

@NgModule({
            imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
            exports: [RouterModule]
          })
export class AppRoutingModule {
}

