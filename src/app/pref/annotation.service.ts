import {EventEmitter, Injectable} from "@angular/core";
import {Auth, Logger} from "aws-amplify";
import {
  APIService,
  OnCreateGroupTweetAnnotationsSubscription,
  OnDeleteGroupTweetAnnotationsSubscription,
  OnUpdateGroupTweetAnnotationsSubscription
} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";

const log = new Logger("annotation-service");

@Injectable({
              providedIn: "root"
            })
export class AnnotationService {

  public tweetAnnotated = new EventEmitter<OnUpdateGroupTweetAnnotationsSubscription | OnCreateGroupTweetAnnotationsSubscription>();
  public tweetAnnotationsRemoved = new EventEmitter<OnDeleteGroupTweetAnnotationsSubscription>();
  private _ready: boolean;
  private _readyPromise: Promise<boolean> = new Promise<boolean>((resolve) => {
    const loop = () => {
      if (this._ready) {
        resolve(true);
      } else {
        log.verbose("Waiting for ready.");
        setTimeout(loop, 100);
      }
    };
    setTimeout(loop, 50);
  });
  private _email: string;
  private _userInfo: any;

  constructor(private _notify: NotificationService, private _api: APIService) {
  }

  private _groups: string[] = [];

  public get groups(): string[] {
    return this._groups;
  }

  public async init(userInfo: any) {
    this._userInfo = userInfo;
    const groups = (await Auth.currentAuthenticatedUser()).signInUserSession.accessToken.payload["cognito:groups"];
    if (typeof userInfo.attributes !== "undefined") {
      this._email = userInfo.attributes.email;
    } else {
      log.error("No attributes in ", userInfo);
    }
    if (!groups || groups.length === 1) {
      this._groups = groups;
    } else {
      log.error("User is a member of more than one group (not supported)");
    }
    log.debug("** Annotation Service Initializing **");
    log.debug(userInfo);

    if (!groups || groups.length === 0) {
      this._notify.show(
        // tslint:disable-next-line:max-line-length
        "Your account is not a member of a group, please ask an administrator to fix this. The application will not work correctly until you do.",
        "I Will",
        180);
      this._groups = ["__invalid__"];
    }

    this._api.OnCreateGroupTweetIgnoreListener.subscribe((subObj: any) => {
      const sub: OnCreateGroupTweetAnnotationsSubscription = subObj.value.data.onCreateGroupTweetAnnotations;
      log.debug("New tweet annotation detected ");
      if (!sub.id) {
        log.warn("Invalid id for sub", sub);
      }
      this.tweetAnnotated.emit(sub);

    });

    this._api.OnUpdateGroupTweetAnnotationsListener.subscribe((subObj: any) => {
      const sub: OnUpdateGroupTweetAnnotationsSubscription = subObj.value.data.onUpdateGroupTweetAnnotations;
      log.debug("Tweet annotation update detected ");
      if (!sub.id) {
        log.warn("Invalid id for sub", sub);
      }
      this.tweetAnnotated.emit(sub);
    });


    this._api.OnDeleteGroupTweetAnnotationsListener.subscribe((subObj: any) => {
      const sub: OnDeleteGroupTweetAnnotationsSubscription = subObj.value.data.onDeleteGroupTweetAnnotations;
      log.debug("New tweet unignore detected ");
      if (!sub.id) {
        log.warn("Invalid id for sub", sub);
      }
      this.tweetAnnotationsRemoved.emit(sub);
    });


  }


  public async waitUntilReady() {
    return this._readyPromise;
  }

  public async getAnnotations(tweet: Tweet) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to retrieve annotations an unparseable tweet.");
      return;
    }
    try {
      const result = await this._api.GetGroupTweetAnnotations(tweet.id);
      log.debug(result);
      if (!result) {
        return {};
      } else {
        return result;
      }
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to get annotations for Tweet, this could be a network error. Refresh the page and try" +
                          " again, if this persists please contact support.", "OK", 60);
    }

  }



  public async addAnnotations(tweet: Tweet, annotations: any) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to annotate an unparseable tweet.");
      return;
    }
    try {

      const id = tweet.id;
      const result = await this._api.GetGroupTweetAnnotations(id);
      log.debug(result);
      if (!result) {
        this._api.CreateGroupTweetAnnotations(
          {
            id,
            url:         tweet.url,
            tweetId:     tweet.id,
            annotatedBy: this._email,
            ownerGroups: this._groups,
            annotations: JSON.stringify(annotations)
          }
        );

      } else {
        const mergedAnnotations = JSON.stringify({...JSON.parse(result.annotations), ...annotations});
        this._api.UpdateGroupTweetAnnotations({id, annotations: mergedAnnotations, annotatedBy: this._email});
      }
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to annotate Tweet, this could be a network error. Refresh the page and try" +
                          " again, if this persists please contact support.", "OK", 60);
    }

  }


  public async removeAllAnnotations(tweet) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to remove annotations from an unparseable tweet.");
      return;
    }
    try {
      const id = tweet.id;
      const result = await this._api.GetGroupTweetAnnotations(id);
      log.debug(result);
      if (result) {
        await this._api.DeleteGroupTweetAnnotations({id});
        log.debug(result);
      } else {
        log.debug("Removed annotations for " + tweet.id);
      }
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to remove annotations for Tweet, this could be a network error. Refresh the page and" +
                          " try" +
                          " again, if this persists please contact support.", "OK", 60);
    }
  }

}
