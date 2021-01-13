import {EventEmitter, Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {DataStore, OpType} from "@aws-amplify/datastore";
import {GroupTweetAnnotations} from "../../models";
import Auth from "@aws-amplify/auth";

const log = new Logger("annotation-service");

@Injectable({
              providedIn: "root"
            })
export class AnnotationService {

  public tweetAnnotated = new EventEmitter<GroupTweetAnnotations>();
  public tweetAnnotationsRemoved = new EventEmitter<GroupTweetAnnotations>();
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

  constructor(private _notify: NotificationService) {
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

    DataStore.observe(GroupTweetAnnotations).subscribe(msg => {
      if (msg.opType === OpType.DELETE) {
        this.tweetAnnotationsRemoved.emit(msg.element);
      } else {
        this.tweetAnnotated.emit(msg.element);
      }
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
      const result = await DataStore.query(GroupTweetAnnotations, q => q.tweetId("eq", tweet.id));
      log.debug(result);
      if (result.length === 0) {
        return {};
      } else {
        return result[0];
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

      const result = await DataStore.query(GroupTweetAnnotations, q => q.tweetId("eq", tweet.id));
      log.debug(result);
      if (result.length === 0) {
        return await DataStore.save(new GroupTweetAnnotations(
          {
            url:         tweet.url,
            tweetId:     tweet.id,
            annotatedBy: this._email,
            ownerGroups: this._groups,
            annotations: JSON.stringify(annotations)
          }
        ));

      } else {
        const mergedAnnotations = JSON.stringify({...JSON.parse(result[0].annotations), ...annotations});
        return await DataStore.save(GroupTweetAnnotations.copyOf(result[0], m => {
          m.annotations = mergedAnnotations;
          m.annotatedBy = this._email;
        }));
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
      return await DataStore.delete(GroupTweetAnnotations, q => q.tweetId("eq", tweet.id));
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to remove annotations for Tweet, this could be a network error. Refresh the page and" +
                          " try" +
                          " again, if this persists please contact support.", "OK", 60);
    }
  }

}
