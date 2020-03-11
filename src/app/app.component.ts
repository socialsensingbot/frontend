import {Component} from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import {AuthService} from "./auth/auth.service";

import {Auth} from "aws-amplify";
import {Router} from "@angular/router";

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

  constructor( private amplifyService: AmplifyService, public auth: AuthService,
               private _router: Router  ) {
    auth.authState.subscribe((event: string) => {
      if (event === AuthService.SIGN_IN)
        this.checkSession();
      if (event === AuthService.SIGN_OUT)
        this.user = undefined;
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
        .then(data => this._router.navigate(['auth/confirm']))
        .catch(err => console.log(err));


  }
}
