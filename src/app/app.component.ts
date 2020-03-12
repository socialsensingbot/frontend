import {Component} from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import {AuthService} from "./auth/auth.service";

import {Auth} from "aws-amplify";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";

@Component({
             selector:    'app-root',
             templateUrl: './app.component.html',
             styleUrls:   ['./app.component.scss']
           })
export class AppComponent {
  title = 'SocialSensing.com';
  signedIn: boolean;
  user: any;
  greeting: string;
  usernameAttributes = "email";
  isAuthenticated: boolean;
  public isSignup: boolean=  !environment.production;

  constructor( private amplifyService: AmplifyService, public auth: AuthService,
               private _router: Router  ) {
    Auth.currentAuthenticatedUser({bypassCache: true}).then(user => this.isAuthenticated = (user != null))
        .catch(err => console.log(err));
    auth.authState.subscribe((event: string) => {
      if (event === AuthService.SIGN_IN) {
        this.checkSession();
        this.isAuthenticated= true;
        this.isSignup= false;
      }
      if (event === AuthService.SIGN_OUT) {
        this.user = undefined;
        this.isAuthenticated= false;
        this.isSignup= !environment.production;
      }
    });
  }
  async checkSession() {
    try {
      const userInfo = await Auth.currentUserInfo();
      if (userInfo && userInfo.attributes.profile) {
        const avatar = userInfo.attributes.profile;
        this.user= userInfo;
        this.isAuthenticated= true;
      }
    } catch(error) {
      console.log('no session: ', error);
    }
  }
  public logout() {
    this.isAuthenticated= false;
    Auth.signOut()
        .then(data => this._router.navigate(['/']))
        .catch(err => console.log(err));


  }
}
