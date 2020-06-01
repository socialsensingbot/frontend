import {Component, OnDestroy, OnInit} from '@angular/core';
import {AmplifyService} from 'aws-amplify-angular';
import {AuthService} from "./auth/auth.service";
import {API, Auth, graphqlOperation, Logger} from "aws-amplify";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";
import {PreferenceService} from "./pref/preference.service";
import {NotificationService} from "./services/notification.service";
import {APIService, OnCreateUserSessionSubscription} from "./API.service";
import {SessionService} from "./auth/session.service";

const log = new Logger('app');

@Component({
             selector:    'app-root',
             templateUrl: './app.component.html',
             styleUrls:   ['./app.component.scss']
           })
export class AppComponent {

  title = 'SocialSensing.com';
  public isDev: boolean = !environment.production;
  user: any;
  isAuthenticated: boolean;
  public isSignup: boolean = !environment.production;

  constructor(private amplifyService: AmplifyService, public auth: AuthService,
              private _router: Router, private _pref: PreferenceService,
              private _notify: NotificationService,
              private _api: APIService,
              private _session: SessionService) {
    Auth.currentAuthenticatedUser({bypassCache: true})
        .then(user => this.isAuthenticated = (user != null))
        .then(() => this.checkSession())
        .catch(err => log.debug(err));
    auth.state.subscribe((event: string) => {
      if (event === AuthService.SIGN_IN) {
        this.isAuthenticated = true;
        this.isSignup = false;
        this.checkSession();
      }
      if (event === AuthService.SIGN_OUT) {
        this.user = undefined;
        this.isAuthenticated = false;
        this.isSignup = !environment.production;
        this._pref.clear();
      }
    });

    this._router.events.subscribe((val) => log.verbose("Router Event: ", val));

  }

  async checkSession() {
    log.debug("checkSession()");
    if (!this.isAuthenticated) {
      log.debug("Not authenticated");
      return;
    }
    log.debug("Authenticated");
    try {
      const userInfo = await Auth.currentUserInfo();
      if (userInfo) {
        await this._pref.init(userInfo);
        await this._session.open(userInfo);
      }

      if (userInfo && userInfo.attributes.profile) {

        this.user = userInfo;
        this.isAuthenticated = true;
        this.isSignup = false;

      }

    } catch (error) {
      this._notify.error(error)
    }
  }

  public logout() {
    this.isAuthenticated = false;
    this._session.close();
    Auth.signOut()
        .then(data => this._router.navigate(['/'], {queryParamsHandling: "merge"}))
        .catch(err => log.debug(err));


  }

  // ngOnInit(): void {
  //   let routeParams: string;
  //   this._router.events
  //       .subscribe(routeEvent => {
  //         if (!(routeEvent instanceof NavigationEnd)) {
  //           return
  //         }
  //
  //         const params = routeEvent.url.split('?')[1];
  //         log.debug(routeEvent.url);
  //
  //         if (params) {
  //           routeParams = params;
  //           return
  //         }
  //
  //         window.history.replaceState({}, '', `${location.pathname}?${routeParams}`)
  //       })
  // }
}
