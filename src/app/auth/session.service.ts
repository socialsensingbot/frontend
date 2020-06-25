import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {API, graphqlOperation, Logger} from "aws-amplify";
import {
  APIService,
  CreateUserSessionMutation,
  GetUserSessionQuery,
  OnCreateUserSessionSubscription
} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Subscription, timer} from "rxjs";
import {PreferenceService} from "../pref/preference.service";
import {AuthService} from "./auth.service";

const log = new Logger("session");

const SESSION_TOKEN = "app-session-token";
const SESSION_END = "app-session-end";

@Injectable({
              providedIn: 'root'
            })
export class SessionService implements OnInit, OnDestroy {
  /**
   * A string id for the session, it is irrelevant what this contains as long as it is unique.
   */
  private _sessionId: string;

  /**
   * This is the subscription to new sessions being added. It is closed OnDestroy.
   */
  private _sessionSubscription: any;

  /**
   * The time a session should remain active for. If you close a browser and reopen
   * the app during this period the same session will be used.
   */
  private readonly sessionDurationInSeconds = 60 * 30;
  /**
   * The heartbeat timer executes to show the session is still active, it updates localStorage and
   * the DynamoDB table.
   */
  private _heartbeatTimer: Subscription;

  /**
   * The session as returned from GetUserSession
   */
  private _session: GetUserSessionQuery;

  constructor(private _notify: NotificationService,
              private _api: APIService,
              private _pref: PreferenceService,
              private _auth: AuthService) {

  }

  /**
   * Stop any running tasks on destruction of this service.
   *
   * (Good housekeeping)
   */
  public ngOnDestroy(): void {
    this.removeSessionSubscription();
    this.stopHeartbeat();
  }

  private stopHeartbeat() {
    if (this._heartbeatTimer) {
      this._heartbeatTimer.unsubscribe();
      this._heartbeatTimer = null;
    }
  }

  private removeSessionSubscription() {
    if (this._sessionSubscription) {
      this._sessionSubscription.unsubscribe();
      this._sessionSubscription = null;
    }
  }

  public ngOnInit(): void {
  }


  /**
   * Create an application level session for a logged in user.
   * @param userInfo
   */
  public async open(userInfo) {
    if (userInfo && !this._sessionId) {
      const sessionToken = window.localStorage.getItem(SESSION_TOKEN);
      const sessionEndTime = window.localStorage.getItem(SESSION_END);

      //We place a token in localStorage so that the session is only unique
      //per browser. It also keeps the session token active during restarts.
      //Mostly this is for auditing sessions, but also to determine which is the
      //oldest session on DynamoDB as that is the session that will be logged out.

      if (sessionToken && sessionEndTime && +sessionEndTime > Date.now()) {
        this._sessionId = sessionToken;
        this.heartbeat();
        log.info("Existing session");
      } else {
        this.createLocalSession(userInfo);
      }


      this._session = await this.getOrCreateServerSession(userInfo);
      this._sessionSubscription = await this.listenForNewServerSessions(userInfo, sessionToken);

      // Start the heartbeat which keeps the session active
      this._heartbeatTimer = timer(0, 60 * 1000).subscribe(() => this.heartbeat());

      return;
    }
  }

  /**
   * Listens for new sessions to be created in DynamoDB
   *
   * @param userInfo the Cognito info for the current user.
   * @param sessionToken a session token using our
   */
  private async listenForNewServerSessions(userInfo, sessionToken: string) {

    //This is run when a new session is created on DynamoDB
    const onSession = (subObj: any) => {
      log.info("New session detected.");
      const sub: OnCreateUserSessionSubscription = subObj.value.data.onCreateUserSession;
      if (!sub.id) {
        log.warn('Invalid id for sub', sub);
      }

      if (sub.id && sub.id !== this._sessionId) {
        log.debug(`${sub.owner} is not ${userInfo.username}`);
        log.debug(sub);
        this.moreThanOneSession(Date.parse(this._session.createdAt) < Date.parse(sub.createdAt));
      }
    };


    return await API.graphql(
      graphqlOperation(
        `subscription OnCreateUserSession($owner: String!) {
        onCreateUserSession(owner: $owner) {
          __typename
          id
          fingerprint
          owner
        }
      }`
        , {owner: userInfo.username})).subscribe(onSession);
  }

  /**
   * Get or create a new session in DynamoDB. Will retry if fails first time,
   * this is to resolve a race condition with other browser windows starting at
   * the same time.
   *
   * @param userInfo the Cognito info for the current user.
   * @param fail if true fail on error, if false then retry.
   */
  private async getOrCreateServerSession(userInfo, fail = false): Promise<GetUserSessionQuery> {
    try {
      const existingSession = await this._api.GetUserSession(this._sessionId);
      if (existingSession) {
        if (existingSession.open) {
          this.moreThanOnce();
          return existingSession;
        } else {
          this.createLocalSession(userInfo);
          await this.createServerSession();
          return this._api.GetUserSession(this._sessionId);
        }
      } else {
        await this.createServerSession();
        return this._api.GetUserSession(this._sessionId);
      }
    } catch (e) {
      if (fail) {
        throw e;
      } else {
        //Potential race condition here with another window logging in so we retry (but fail next time for real)
        return this.getOrCreateServerSession(userInfo, true);
      }
    }
  }

  /**
   * Creates a new server session which includes auditing information
   */
  private async createServerSession(): Promise<CreateUserSessionMutation> {
    let client: string;
    try {
      client = await (await fetch('https://ipapi.co/json/')).text();
    } catch (e) {
      client = "Client info error: " + e;
    }


    return this._api.CreateUserSession({
                                         id:          this._sessionId,
                                         fingerprint: this.calculateFingerPrint(),
                                         client,
                                         open:        true
                                       });
  }

  private createLocalSession(userInfo) {
    log.info("New session");
    this._sessionId = userInfo.attributes.email + ":" + Date.now() + ":" + this.calculateFingerprintHash() + ":" + Math.floor(
      Math.random() * 1000000000000);
    window.localStorage.setItem(SESSION_TOKEN, this._sessionId);
  }

  public async heartbeat() {
    window.localStorage.setItem(SESSION_END, "" + (Date.now() + 1000 * this.sessionDurationInSeconds));
    try {
      await this._api.UpdateUserSession({id: this._sessionId, open: true})
    } catch (e) {
      log.error("Heartbeat failed", e);
    }
  }

  /**
   * In the future this will log out the current Cognito session. For now it displays a warning.
   *
   * @param oldest confirmation that this indeed is the older session.
   *
   * @TODO: remove oldest param
   */
  private async moreThanOneSession(oldest: boolean = true) {
    if (this._pref.group.multipleSessions) {
      log.info("User logged in more than once, which group preferences or the environment allow.");
    } else {
      this._notify.show("You are logged in more than once this session will now be logged out.", "OK", 30);
      window.setTimeout(async () => {
        await this._auth.signOut();
        window.location.reload();
      }, 8000);
    }
  }

  /**
   * The user is logged into more than one window of the current browser.
   */
  private moreThanOnce() {
    log.info("User logged into more than one window but one log in session, this message is informational only.");
  }

  /**
   * The session has been actively terminated (likely by logout).
   */
  public async close() {
    log.info("Closing user session");
    this.removeSessionSubscription();
    this.stopHeartbeat();
    await this._api.UpdateUserSession({id: this._sessionId, open: false})
    this._sessionId = null;
    window.localStorage.removeItem(SESSION_TOKEN);
  }

  /**
   * The fingerprint hash is a string roughly unique to the browser a user is using.
   */
  private calculateFingerprintHash() {
    log.debug("calculateFingerprintHash()")
    return this.checksum(this.calculateFingerPrint());

  }

  /**
   * // http://stackoverflow.com/a/4167870/1250044
   */
  private map(arr, fn) {
    var i = 0, len = arr.length, ret = [];
    while (i < len) {
      ret[i] = fn(arr[i++]);
    }
    return ret;
  }

  // https://github.com/darkskyapp/string-hash
  private checksum(str) {
    var hash = 5381,
      i = str.length;

    while (i--) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }

    return hash >>> 0;
  }

  /**
   * The fingerprint is a string indicative of which browser a user is using. It
   * is there for debugging session issues and to add some basic audit in the session
   * table.
   */
  private calculateFingerPrint() {
    return [
      navigator.userAgent,
      [screen.height, screen.width, screen.colorDepth].join('x'),
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      this.map(navigator.plugins, (plugin) => {
        return [
          plugin.name,
          plugin.description,
          this.map(plugin, (mime) => {
            return [mime.type, mime.suffixes].join('~');
          }).join(',')
        ].join("::");
      }).join(';')
    ].join('###');
  }
}
