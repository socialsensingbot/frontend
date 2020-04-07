import {Component} from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';
import {AuthService} from "./auth/auth.service";
import {API, Auth, graphqlOperation} from "aws-amplify";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";
import {PreferenceService} from "./pref/preference.service";

@Component({
             selector:    'app-root',
             templateUrl: './app.component.html',
             styleUrls:   ['./app.component.scss']
           })
export class AppComponent {
  title = 'SocialSensing.com';
  user: any;
  usernameAttributes = "email";
  isAuthenticated: boolean;
  public isSignup: boolean=  !environment.production;

  constructor( private amplifyService: AmplifyService, public auth: AuthService,
               private _router: Router, private _pref: PreferenceService  ) {
    Auth.currentAuthenticatedUser({bypassCache: true}).then(user => this.isAuthenticated = (user != null)).then(()=>this.checkSession())
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
        this._pref.clear();
      }
    });

  }
  async checkSession() {
    console.log("checkSession()");
    if(!this.isAuthenticated) {
      console.log("Not authenticated");
      return;
    }
    try {
      const userInfo = await Auth.currentUserInfo();
      if(userInfo) {
        await this._pref.init(userInfo);
      }
      if (userInfo && userInfo.attributes.profile) {
        const avatar = userInfo.attributes.profile;
        this.user= userInfo;
        this.isAuthenticated= true;
        this.isSignup= false;


      }
    } catch(error) {
      console.error('no session: ', error);
    }
  }
  public logout() {
    this.isAuthenticated= false;
    Auth.signOut()
        .then(data => this._router.navigate(['/'], {queryParamsHandling:"merge"}))
        .catch(err => console.log(err));


  }
}
