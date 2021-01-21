import {EventEmitter, Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {DataStore, OpType} from "@aws-amplify/datastore";
import {GroupTweetAnnotations} from "../../models";
import {PreferenceService} from "./preference.service";
import {AuthService} from "../auth/auth.service";

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
  private _userInfo: any;

  constructor(private _notify: NotificationService, private _prefs: PreferenceService, private _auth: AuthService) {
  }

  public async init(userInfo: any) {
    log.debug("** Annotation Service Initializing **");
    this._userInfo = userInfo;

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

    return DataStore.query(GroupTweetAnnotations,
                           q => q.tweetId("eq", tweet.id)
                                 .ownerGroups("contains", this._prefs.groups[0]))
                    .then(result => {
                      log.debug(result);
                      if (result.length === 0) {
                        return null;
                      } else {
                        return result[0];
                      }
                    }).catch(e => {
        log.error(e);
        this._notify.show(
          "Failed to get annotations for Tweet, this could be a network error. Refresh the page and try" +
          " again, if this persists please contact support.", "OK", 60);
        return e;
      });

  }


  public async addAnnotations(tweet: Tweet, annotations: any): Promise<GroupTweetAnnotations> {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to annotate an unparseable tweet.");
      return;
    }
    try {

      const result = await DataStore.query(GroupTweetAnnotations,
                                           q => q.tweetId("eq", tweet.id)
                                                 .ownerGroups("contains", this._prefs.groups[0])
      );
      log.debug(result);
      const email = await this._auth.email();
      if (result.length === 0) {
        return await DataStore.save(new GroupTweetAnnotations(
          {
            url:         tweet.url,
            tweetId:     tweet.id,
            annotatedBy: email,
            ownerGroups: this._prefs.groups,
            annotations: JSON.stringify(annotations)
          }
        ));

      } else {
        const mergedAnnotations = JSON.stringify({...JSON.parse(result[0].annotations), ...annotations});
        return await DataStore.save(GroupTweetAnnotations.copyOf(result[0], m => {
          m.annotations = mergedAnnotations;
          m.annotatedBy = email;
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
      return await DataStore.delete(GroupTweetAnnotations,
                                    q => q.tweetId("eq", tweet.id)
                                          .ownerGroups("contains", this._prefs.groups[0])
      );
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to remove annotations for Tweet, this could be a network error. Refresh the page and" +
                          " try" +
                          " again, if this persists please contact support.", "OK", 60);
    }
  }

}
