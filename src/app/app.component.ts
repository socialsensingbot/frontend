import {Component, Inject} from "@angular/core";
import {AuthService} from "./auth/auth.service";
import {Hub, Logger} from "@aws-amplify/core";
import {Router} from "@angular/router";
import {environment} from "../environments/environment";
import {PreferenceService} from "./pref/preference.service";
import {NotificationService} from "./services/notification.service";
import {SessionService} from "./auth/session.service";
import * as Rollbar from "rollbar";
import {RollbarService} from "./error";
import {DataStore} from "@aws-amplify/datastore";
import Auth from "@aws-amplify/auth";


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
  private dataStoreListener: any;
  private initiateLogout: boolean;
  private dataStoreSynced: boolean;

  constructor(public auth: AuthService,
              public pref: PreferenceService,
              private _router: Router, private _pref: PreferenceService,
              private _notify: NotificationService,
              private _session: SessionService,
              @Inject(RollbarService) private _rollbar: Rollbar) {

    Auth.currentAuthenticatedUser({bypassCache: true})
        .then(user => this.isAuthenticated = (user != null))
        .then(user => this.auth.loggedIn = (user != null))
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


    this.dataStoreListener = Hub.listen("datastore", async (capsule) => {
      const {
        payload: {event, data},
      } = capsule;

      console.log("DataStore event", event, data);

      if (event === "outboxStatus") {
        this.dataStoreSynced = data.isEmpty;
        if (data.isEmpty && this.initiateLogout) {
          this._notify.show("Data synced.", "OK", 2);

          setTimeout(() => this.doLogout(), 500);
        }

      }
      if (event === "ready") {
        this._notify.show("Synced data with the server ...", "OK", 5);

        const user = await Auth.currentAuthenticatedUser();
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
            return;
          }
          try {
            await this._session.open(userInfo);
          } catch (e) {
            console.error(
              "There was a problem with creating your session, please ask an administrator to look into this.",
              e);
            console.error(user);
            this._rollbar.error(
              "There was a problem with creating your session, please ask an administrator to look into this.", e);
          }
          log.info("Locale detected: " + getLang());
          log.info("Locale in use: " + this._pref.combined.locale);
          log.info("Timezone detected: " + Intl.DateTimeFormat().resolvedOptions().timeZone);
          log.info("Timezone in use: " + this._pref.combined.timezone);
          // Start the DataStore, this kicks-off the sync process.
          this._rollbar.configure(
            {
              enabled: environment.rollbar,
              // environment: environment.name,
              captureIp:    "anonymize",
              code_version: environment.version,
              payload:      {
                person: {
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


          if (userInfo && userInfo.attributes.profile) {

            this.user = userInfo;
            this.isAuthenticated = true;
            this.isSignup = false;
          }
        }
      }
    });
    await DataStore.start();
    this._notify.show("Syncing data with the server ...", "OK", 30);
  }

  public async logout() {
    await this._session.close();
    if (!this.dataStoreSynced) {
      this.initiateLogout = true;

      this._notify.show("Syncing data before logout.", "OK", 30);
    } else {
      await this.doLogout();
    }


  }

  private async doLogout() {
    this.initiateLogout = false;
    this.isAuthenticated = false;
    log.info("Clearing data store.");
    await DataStore.clear();
    log.info("Performing sign out.");
    await Auth.signOut()
              .then(i => this._router.navigate(["/"], {queryParamsHandling: "merge"}))
              .catch(err => log.error(err));
    log.info("Performed sign out.");
  }

}
