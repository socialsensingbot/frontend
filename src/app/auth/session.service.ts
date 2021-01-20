import {Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Subscription, timer} from "rxjs";
import {PreferenceService} from "../pref/preference.service";
import {AuthService} from "./auth.service";
import {DataStore} from "@aws-amplify/datastore";
import {UserSession} from "../../models";
import Auth from "@aws-amplify/auth";

const log = new Logger("session");

const SESSION_TOKEN = "app-session-token";
const SESSION_END = "app-session-end";

const HEARTBEAT_FREQ = 60 * 1000;

@Injectable({
              providedIn: "root"
            })
export class SessionService {

  /**
   * This is the subscription to new sessions being added. It is closed OnDestroy.
   */
  private _sessionSubscription: any = null;

  /**
   * The time a session should remain active for. If you close a browser and reopen
   * the app during this period the same session will be used.
   */
  private readonly sessionDurationInSeconds = 60 * 30;
  /**
   * The heartbeat timer executes to show the session is still active, it updates localStorage and
   * the DynamoDB table.
   */
  private _heartbeatTimer: Subscription = null;

  private session: UserSession = null;
  private _sessionId: string = null;

  constructor(private _notify: NotificationService,
              private _pref: PreferenceService,
              private _auth: AuthService) {

  }

  /**
   * Stop any running tasks on destruction of this service.
   *
   * (Good housekeeping)
   */
  public finish(): void {
    this.removeSessionSubscription();
    this.stopHeartbeat();
  }


  /**
   * Create an application level session for a logged in user.
   * @param userInfo
   */
  public async open(userInfo) {
    log.info("Opening session");
    await this._pref.waitUntilReady();
    if (userInfo && this.session === null) {
      const sessionToken = window.localStorage.getItem(SESSION_TOKEN);
      const sessionEndTime = window.localStorage.getItem(SESSION_END);

      // We place a token in localStorage so that the session is only unique
      // per browser. It also keeps the session token active during restarts.
      // Mostly this is for auditing sessions, but also to determine which is the
      // oldest session on DynamoDB as that is the session that will be logged out.

      if (sessionToken && sessionEndTime && +sessionEndTime > Date.now()) {
        this._sessionId = sessionToken;
        this.session = await this.getSessionOrNull();
        await this.heartbeat();
        log.info("Existing session " + this._sessionId);
      } else {
        this.createLocalSession(userInfo);
        log.info("New session " + this._sessionId);
      }


      this.session = await this.getOrCreateServerSession(userInfo);
      if (this.session === null) {
        log.warn("Failed to get or create server session, this may be because of user limit, see elsewhere in the" +
                      " log.");
        window.localStorage.removeItem(SESSION_TOKEN);
        this._sessionId = null;
      } else {
        this._sessionSubscription = await this.listenForNewServerSessions(userInfo, sessionToken);
        // Start the heartbeat which keeps the session active
        this._heartbeatTimer = timer(HEARTBEAT_FREQ, HEARTBEAT_FREQ).subscribe(() => this.heartbeat());
      }


      return;
    }
  }

  public async heartbeat() {
    await this._pref.waitUntilReady();
    window.localStorage.setItem(SESSION_END, "" + this.localTTL());
    if (this._auth.loggedIn && this.session !== null) {
      try {

        this.session = await DataStore.save(UserSession.copyOf(this.session, updated => {
          updated.ttl = this.serverTTL();
          updated.open = true;
        }));
      } catch (e) {
        log.error("Heartbeat failed", e);
      }
    }
  }

  /**
   * The session has been actively terminated (likely by logout).
   */
  public async close() {
    window.localStorage.removeItem(SESSION_TOKEN);
    await this._pref.waitUntilReady();
    const session = this.session;
    this.session = null;
    this.removeSessionSubscription();
    if (this._auth.loggedIn) {
      this.stopHeartbeat();
      log.info("Closing server session");
      try {
        await DataStore.save(UserSession.copyOf(session, updated => {
          updated.open = false;
        }));
        log.info("Closed server session");
      } catch (e) {
        log.error("Failed to close server session", e);
      }
    } else {
      log.warn("Logout called but user not logged in!");
    }

    this._sessionId = null;
  }

  private stopHeartbeat() {
    if (this._heartbeatTimer !== null) {
      this._heartbeatTimer.unsubscribe();
      this._heartbeatTimer = null;
    }
  }

  private removeSessionSubscription() {
    if (this._sessionSubscription !== null) {
      this._sessionSubscription.unsubscribe();
      this._sessionSubscription = null;
    }
  }

  /**
   * Listens for new sessions to be created in DynamoDB
   *
   * @param userInfo the Cognito info for the current user.
   * @param sessionToken a session token using our
   */
  private async listenForNewServerSessions(userInfo, sessionToken: string) {
    return await DataStore.observe(UserSession).subscribe(msg => {
      console.log(msg.model, msg.opType, msg.element);
      if (msg.element.owner === userInfo.username && msg.element.open === true) {
        log.info("New session detected.");
        const sub = msg.element;
        if (!sub.id) {
          log.warn("Invalid id for sub", sub);
        }

        if (this.session && sub.id && sub.id !== this.session.id) {
          log.debug(`${sub.id} is not ${this.session.id}`);
          log.debug(sub);
          this.moreThanOneSession(this.session.createdAt < sub.createdAt);
        }
      }
    });

  }

  private createLocalSession(userInfo) {
    log.info("New session");
    this._sessionId = userInfo.attributes.email + ":" + Date.now() + ":" + this.calculateFingerprintHash() + ":" + Math.floor(
      Math.random() * 1000000000000);
    window.localStorage.setItem(SESSION_TOKEN, this._sessionId);
  }

  /**
   * Get or create a new session in DynamoDB. Will retry if fails first time,
   * this is to resolve a race condition with other browser windows starting at
   * the same time.
   *
   * @param userInfo the Cognito info for the current user.
   * @param fail if true fail on error, if false then retry.
   */
  private async getOrCreateServerSession(userInfo, fail = false): Promise<UserSession> {
    try {
      if (await this.checkUserLimit()) {

        const existingSession = await this.getSessionOrNull();
        if (existingSession) {
          if (existingSession.open) {
            this.moreThanOnce();
            return existingSession;
          } else {
            this.createLocalSession(userInfo);
            await this.createServerSession();
            return await this.getSessionOrNull();
          }
        } else {
          await this.createServerSession();
          return await this.getSessionOrNull();
        }
      } else {
        return null;
      }
    } catch (e) {
      if (fail) {
        throw e;
      } else {
        // Potential race condition here with another window logging in so we retry (but fail next time for real)
        return this.getOrCreateServerSession(userInfo, true);
      }
    }
  }

  private async getSessionOrNull(): Promise<UserSession | null> {
    const result = await DataStore.query(UserSession, q => q.sessionId("eq", this._sessionId));
    if (result.length === 0) {
      return null;
    } else {
      return result[0];
    }
  }

  /**
   * Creates a new server session which includes auditing information
   */
  private async createServerSession(): Promise<UserSession> {
    let client: string;
    try {
      client = await (await fetch("https://ipapi.co/json/")).text();
    } catch (e) {
      client = "Client info error: " + e;
    }


    return DataStore.save(new UserSession({
                                            fingerprint: this.calculateFingerPrint(),
                                            client,
                                            open:        true,
                                            ttl:         this.serverTTL(),
                                            group:       this._pref.groups[0],
                                            owner:       (await Auth.currentUserInfo()).username,
                                            sessionId:   this._sessionId
                                          }));


  }

  /**
   * In the future this will log out the current Cognito session. For now it displays a warning.
   *
   * @param oldest confirmation that this indeed is the older session.
   *
   * @TODO: remove oldest param
   */
  private async moreThanOneSession(oldest: boolean = true) {
    if (this._pref.combined.multipleSessions) {
      log.info("User logged in more than once, which group preferences, or the environment allows.");
    } else {
      this._notify.show("You are logged in more than once this session will now be logged out.", "OK", 30);
      window.setTimeout(async () => {
        await this._auth.signOut();
        window.location.reload();
      }, 8000);
    }
  }

  private async checkUserLimit() {
    await this._pref.waitUntilReady();
    const group = this._pref.groups[0];
    const sessionItems = await DataStore.query(UserSession,
                                               q => q.group("eq", group).open("eq", true));
    const userSessions = sessionItems.map(i => i.owner);
    const loggedInCount = new Set(userSessions).size;
    if (this._pref.combined.maxUsers > -1) {
      if (loggedInCount > this._pref.combined.maxUsers) {
        window.setTimeout(async () => {
          await this._auth.signOut();
          window.location.reload();
        }, 15000);
        window.setTimeout(async () => {
          this._notify.show(
            `Your group's account has a limit of ${this._pref.combined.maxUsers} concurrent users, you will now be logged out.`,
            "OK", 30);
        }, 8000);
        log.info(
          `${loggedInCount} logged-in users for group ${group} and exceeded concurrent user limit of ${this._pref.combined.maxUsers}.`);
        return false;
      } else {
        log.info(
          `${loggedInCount} logged-in users for group  ${group} and within concurrent user limit of ${this._pref.combined.maxUsers}.`);
        return true;
      }
    } else {
      log.info(
        `${loggedInCount} logged-in users for group ${group} and NO concurrent user limit of ${this._pref.combined.maxUsers}.`);
      return true;
    }
  }

  /**
   * The user is logged into more than one window of the current browser.
   */
  private moreThanOnce() {
    log.info("User logged into more than one window but one log in session, this message is informational only.");
  }

  private localTTL(): number {
    return Date.now() + 1000 * this.sessionDurationInSeconds;
  }


  private serverTTL(): number {
    return Math.floor((Date.now() + 5 * HEARTBEAT_FREQ) / 1000);
  }

  /**
   * The fingerprint hash is a string roughly unique to the browser a user is using.
   */
  private calculateFingerprintHash() {
    log.debug("calculateFingerprintHash()");
    return this.checksum(this.calculateFingerPrint());

  }

  /**
   * // http://stackoverflow.com/a/4167870/1250044
   */
  private map(arr, fn) {
    let i = 0, len = arr.length, ret = [];
    while (i < len) {
      ret[i] = fn(arr[i++]);
    }
    return ret;
  }

  // https://github.com/darkskyapp/string-hash
  private checksum(str) {
    let hash = 5381,
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
      [screen.height, screen.width, screen.colorDepth].join("x"),
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      this.map(navigator.plugins, (plugin) => {
        return [
          plugin.name,
          plugin.description,
          this.map(plugin, (mime) => {
            return [mime.type, mime.suffixes].join("~");
          }).join(",")
        ].join("::");
      }).join(";")
    ].join("###");
  }
}
