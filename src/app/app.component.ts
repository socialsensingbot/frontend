import {Component, Inject, OnDestroy, OnInit} from "@angular/core";
import {AmplifyService} from "aws-amplify-angular";
import {AuthService} from "./auth/auth.service";
import {Auth, Logger} from "aws-amplify";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";
import {PreferenceService} from "./pref/preference.service";
import {NotificationService} from "./services/notification.service";
import {APIService, OnCreateUserSessionSubscription} from "./API.service";
import {SessionService} from "./auth/session.service";
import * as Rollbar from "rollbar";
import {RollbarService} from "./error";


const log = new Logger("app");

function getLang() {
  if (navigator.languages !== undefined) {
    return navigator.languages[0];
  } else {
    return navigator.language;
  }
}

@Component({
             selector:    "app-root",
             templateUrl: "./app.component.html",
             styleUrls:   ["./app.component.scss"]
           })
export class AppComponent {

  title = "SocialSensing.com";
  public isDev: boolean = !environment.production;
  user: any;
  isAuthenticated: boolean;
  public isSignup: boolean = !environment.production;

  constructor(private amplifyService: AmplifyService,
              public auth: AuthService,
              public pref: PreferenceService,
              private _router: Router, private _pref: PreferenceService,
              private _notify: NotificationService,
              private _api: APIService,
              private _session: SessionService,
              @Inject(RollbarService) private _rollbar: Rollbar) {
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
        this._session.close();
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

    const userInfo = await Auth.currentUserInfo();
    if (userInfo) {
      try {
        await this._pref.init(userInfo);
      } catch (e) {
        this._rollbar.error(e);
        log.error(e);
        this._notify.show(
          // tslint:disable-next-line:max-line-length
          "There was a problem with your application preferences, please ask an administrator to fix this. The application may not work correctly until you do.",
          "I Will",
          30);
      }
      try {
      await this._session.open(userInfo);
      } catch (e) {
        this._rollbar.error(e);
        log.error(e);
        this._notify.show(
          // tslint:disable-next-line:max-line-length
          "There was a problem with creating your session, please ask an administrator to look into this.",
          "Sure",
          30);
      }
      log.info("Locale detected: " + getLang());
      log.info("Locale in use: " + this._pref.combined.locale);
      log.info("Timezone detected: " + Intl.DateTimeFormat().resolvedOptions().timeZone);
      log.info("Timezone in use: " + this._pref.combined.timezone);
      this._rollbar.configure(
        {
          enabled:      environment.rollbar,
          // environment: environment.name,
          captureIp:    "anonymize",
          code_version: environment.version,
          payload:      {
            person:           {
              id:       userInfo.username,
              username: userInfo.username,
              groups:   this._pref.groups
            },
            // environment: environment.name,
            environment_info: environment,
            prefs:            {
                group: this._pref.combined
              }
            }
          }
        );
      }

    if (userInfo && userInfo.attributes.profile) {

      this.user = userInfo;
      this.isAuthenticated = true;
      this.isSignup = false;
    }


  }

  public logout() {
    this.isAuthenticated = false;
    this._session.close();
    Auth.signOut()
        .then(data => this._router.navigate(["/"], {queryParamsHandling: "merge"}))
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
