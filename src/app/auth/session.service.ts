import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {API, Auth, graphqlOperation, Logger} from "aws-amplify";
import {
  APIService,
  CreateUserSessionMutation,
  GetUserSessionQuery,
  OnCreateUserSessionSubscription
} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Subscription, timer} from "rxjs";

const log = new Logger("session");

const SESSION_TOKEN = "app-session-token";
const SESSION_END = "app-session-end";

@Injectable({
              providedIn: 'root'
            })
export class SessionService implements OnInit, OnDestroy {
  private _sessionId: any;
  private _sessionSubscription: any;
  private readonly sessionDurationInSeconds = 60 * 30;
  private _heartbeatTimer: Subscription;
  private _fingerprint: string = `${navigator.appName}:${navigator.appCodeName}:${navigator.platform}:${navigator.appVersion.substring(
    0, 4).trim()}:${navigator.javaEnabled()}:${screen.width}:${screen.height}`;
  private _session: CreateUserSessionMutation;

  constructor(private _notify: NotificationService, private _api: APIService) {

  }


  public ngOnDestroy(): void {
    this._sessionSubscription.unsubscribe();
    this._heartbeatTimer.unsubscribe();
  }

  public ngOnInit(): void {
    this._heartbeatTimer = timer(0, 60 * 1000).subscribe(() => this.heartbeat());
  }


  public async open(userInfo) {
    if (userInfo && !this._sessionId) {
      if (window.localStorage.getItem(SESSION_TOKEN) && window.localStorage.getItem(
        SESSION_END) && +window.localStorage.getItem(
        SESSION_END) > new Date().getTime()) {
        this._sessionId = window.localStorage.getItem(SESSION_TOKEN);
        this.heartbeat();
        log.info("Existing session");
      } else {
        this.newSession(userInfo);
      }

      this._session = await this.getOrCreateSession(userInfo);

      this._sessionSubscription = await API.graphql(
        graphqlOperation(
          `subscription OnCreateUserSession($owner: String!) {
        onCreateUserSession(owner: $owner) {
          __typename
          id
          fingerprint
          owner
        }
      }`
          , {owner: userInfo.username})).subscribe((subObj: any) => {
        this._sessionId = window.localStorage.getItem(SESSION_TOKEN);
        const sub: OnCreateUserSessionSubscription = subObj.value.data.onCreateUserSession;
        if (!sub.id) {
          log.warn('Invalid id for sub', sub);
        }

        if (sub.id && sub.id !== this._sessionId) {
          log.debug(`${sub.owner} is not ${userInfo.username}`);
          log.debug(sub);
          this.moreThanOneSession(Date.parse(this._session.createdAt) < Date.parse(sub.createdAt));
        }
      });
      return;
    }
  }

  private async getOrCreateSession(userInfo, fail = false): Promise<GetUserSessionQuery> {
    try {
      const existingSession = await this._api.GetUserSession(this._sessionId);
      if (existingSession) {
        if (existingSession.open) {
          this.moreThanOnce();
          return existingSession;
        } else {
          this.newSession(userInfo);
          await this.createSession();
          return this._api.GetUserSession(this._sessionId);
        }
      } else {
        await this.createSession();
        return this._api.GetUserSession(this._sessionId);
      }
    } catch (e) {
      if (fail) {
        throw e;
      } else {
        //Potential race condition here with another window logging in so we retry (but fail next time for real)
        return this.getOrCreateSession(userInfo, true);
      }
    }
  }

  private async createSession(): Promise<CreateUserSessionMutation> {
    const client = await (await fetch('https://ipapi.co/json/')).text();

    return this._api.CreateUserSession({
                                         id:          this._sessionId,
                                         fingerprint: this._fingerprint,
                                         client,
                                         open:        true
                                       });
  }

  private newSession(userInfo) {
    log.info("New session");
    this._sessionId = userInfo.attributes.email + ":" + this._fingerprint + ":" + Math.floor(
      Math.random() * 1000000000000);
    window.localStorage.setItem(SESSION_TOKEN, this._sessionId);
    this.heartbeat();
  }

  public heartbeat() {
    window.localStorage.setItem(SESSION_END, "" + (new Date().getTime() + 1000 * this.sessionDurationInSeconds));
  }

  private moreThanOneSession(oldest: boolean = false) {
    this._notify.show("You are logged in more than once, in future this session will be logged out.", "OK", 30);
  }

  private moreThanOnce() {
    log.info("User logged into more than one window but one log in session.");
  }

  public async close() {
    await this._api.UpdateUserSession({id: this._sessionId, open: false})
    this._sessionId = null;
    window.localStorage.removeItem(SESSION_TOKEN);
  }
}
