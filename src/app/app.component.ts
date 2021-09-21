import {Component, Inject} from "@angular/core";
import {AuthService} from "./auth/auth.service";
import {Hub, Logger} from "@aws-amplify/core";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../environments/environment";
import {PreferenceService} from "./pref/preference.service";
import {NotificationService} from "./services/notification.service";
import {SessionService} from "./auth/session.service";
import * as Rollbar from "rollbar";
import {RollbarService} from "./error";
import {DataStore} from "@aws-amplify/datastore";
import Auth from "@aws-amplify/auth";
import {AnnotationService} from "./pref/annotation.service";
import {UIExecutionService} from "./services/uiexecution.service";
import {LoadingProgressService} from "./services/loading-progress.service";
import {NgForageCache} from "ngforage";


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
    public ready = false;

    constructor(public auth: AuthService,
                public pref: PreferenceService,
                private _router: Router,
                private _route: ActivatedRoute,
                private _notify: NotificationService,
                private _session: SessionService,
                private _annotation: AnnotationService,
                private _cache: NgForageCache,
                @Inject(RollbarService) private _rollbar: Rollbar, private _exec: UIExecutionService,
                public loading: LoadingProgressService) {

        loading.progress("Starting Application", 1);
        Auth.currentAuthenticatedUser({bypassCache: true})
            .then(user => this.isAuthenticated = (user != null))
            .then(user => this.auth.loggedIn = (user != null))
            .then(() => this.checkSession())
            .catch(err => log.debug(err));
        auth.state.subscribe(async (event: string) => {
            if (event === AuthService.SIGN_IN) {
                this.isAuthenticated = true;
                this.isSignup = false;
                await this.checkSession();
            }
            if (event === AuthService.SIGN_OUT) {
                this.user = undefined;
                this.isAuthenticated = false;
                this.isSignup = !environment.production;
                this.pref.clear();
            }
        });


        this._router.events.subscribe((val) => log.verbose("Router Event: ", val));

    }

    async checkSession() {

        if (this._route.snapshot.queryParamMap.has("__clear_cache__")) {
            try {
                log.info("Clearing ngForage cache");
                await this._cache.clear();
                await DataStore.clear();
                log.info("Clearing session storage");
                sessionStorage.clear();
                log.info("Clearing local storage");
                localStorage.clear();
                log.info("Clearing IndexDB");
                ["amplify-datastore", "ngForage"].forEach(item => {
                    window.indexedDB.deleteDatabase(item);
                });
                log.info("Clearing cookies");
                document.cookie.split(";").forEach(c => {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });
                log.info("ALL caches cleared, logging out.");
                await Auth.signOut();
            } finally {
                log.info("Logged out, redirecting.");
                window.location.href = "/";

            }
        }


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

            log.debug("DataStore event", event, data);

            if (event === "outboxStatus") {
                this.dataStoreSynced = data.isEmpty;
                if (data.isEmpty && this.initiateLogout) {
                    this.loading.progress("Synced", 2);

                    setTimeout(() => this.doLogout(), 500);
                }

            }
            if (event === "ready" && !this.initiateLogout) {
                this.loading.progress("Synced data with the server ...", 2);

                const user = await Auth.currentAuthenticatedUser();
                const userInfo = await Auth.currentUserInfo();
                if (userInfo) {
                    try {
                        await this.pref.init(userInfo);
                        this.ready = true;
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
                        log.error(
                            "There was a problem with creating your session, please ask an administrator to look into this.",
                            e);
                        log.error(user);
                        this._rollbar.error(
                            "There was a problem with creating your session, please ask an administrator to look into this.", e);
                    }
                    try {
                        await this._annotation.init(userInfo);
                    } catch (e) {
                        log.error(
                            "There was a problem with the annotation service, please ask an administrator to look into this.",
                            e);
                        log.error(user);
                        this._rollbar.error(
                            "There was a problem with creating the annotation service, " +
                            "please ask an administrator to look into this.",
                            e);
                    }
                    await this._exec.start();
                    log.info("Locale detected: " + getLang());
                    log.info("Locale in use: " + this.pref.combined.locale);
                    log.info("Timezone detected: " + Intl.DateTimeFormat().resolvedOptions().timeZone);
                    log.info("Timezone in use: " + this.pref.combined.timezone);
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
                                    groups:   this.pref.groups
                                },
                                // environment: environment.name,
                                environment_info: environment,
                                prefs:            {
                                    group: this.pref.combined
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
        try {
            if (environment.showLoadingMessages) {
                this.loading.progress("Syncing data with the server ...", 3);
            }
            await DataStore.start();
            if (environment.showLoadingMessages) {
                this.loading.progress("Data synced with the server ...", 4);
            }
        } catch (e) {
            log.error(e);
            await DataStore.clear();
            await DataStore.start();
            this._notify.show("Failed to sync data with the server. Please refresh the page.", "OK", 300);
        }
    }

    public async logout() {
        log.info("LOGOUT: Logout triggered by user.");
        await this._session.close();
        if (!this.dataStoreSynced) {
            this.initiateLogout = true;
            // failsafe
            setTimeout(() => this.doLogout(), 5000);
            this.loading.progress("Syncing data before logout.", 1);
        } else {
            await this.doLogout();
        }


    }

    private async doLogout() {
        if (!this.initiateLogout) {
            return;
        }
        this.isAuthenticated = false;
        log.info("LOGOUT: Performing sign out.");
        this.loading.progress("Signing out...", 1);
        try {
            await this.auth.signOut();
            this.loading.progress("Signed out...", 4);
        } catch (e) {
            this._notify.error(e);
        }
        this._exec.stop();
        this.initiateLogout = false;
        await this._router.navigate(["/"], {queryParamsHandling: "merge"});
        log.info("LOGOUT: Performed sign out.");
    }

}
