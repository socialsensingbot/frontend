import {EventEmitter, Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {DataStore, OpType} from "@aws-amplify/datastore";
import {GroupTweetAnnotations} from "../../models";
import {PreferenceService} from "./preference.service";
import {AuthService} from "../auth/auth.service";
import {NgForageCache} from "ngforage";

const log = new Logger("AnnotationService");

@Injectable({
              providedIn: "root"
            })
export class AnnotationService {

  public tweetAnnotated = new EventEmitter<GroupTweetAnnotations>();
  public tweetAnnotationsRemoved = new EventEmitter<GroupTweetAnnotations>();
  private _observable;
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
  private _cached = {};

  constructor(private _notify: NotificationService, private _pref: PreferenceService, private _auth: AuthService,
              private _cache: NgForageCache) {
  }

  public async init(userInfo: any) {
    await this._pref.waitUntilReady();
    log.debug("** Annotation Service Initializing **");
    this._userInfo = userInfo;
    this._observable = DataStore.observe(GroupTweetAnnotations, q => q.ownerGroups("contains", this._pref.groups[0]));

    this._observable.subscribe(msg => {
      log.info("Annotation subscription message received", msg);
      if (msg.opType === OpType.DELETE) {
        delete this._cached[msg.element.tweetId];
        this.tweetAnnotationsRemoved.emit(msg.element);
      } else {
        this._cached[msg.element.tweetId] = msg.element;
        this.tweetAnnotated.emit(msg.element);
      }
    });

    await this.updateCache();
    this._ready = true;
    log.info("Initialized Annotation Service");

  }

  public async waitUntilReady() {
    return this._readyPromise;
  }

  public async getAnnotations(tweet: Tweet): Promise<GroupTweetAnnotations | null> {
    await this.waitUntilReady();
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to retrieve annotations an unparseable tweet.");
      return;
    }

    log.debug(this._cached[tweet.id]);
    return this._cached[tweet.id] || null;
  }

  public async addAnnotations(tweet: Tweet, annotations: any): Promise<GroupTweetAnnotations> {
    await this.waitUntilReady();
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to annotate an unparseable tweet.");
      return;
    }
    try {

      const result = this.getAnnotations(tweet);
      log.debug(result);
      const email = await this._auth.email();
      if (result) {
        const saved = DataStore.save(new GroupTweetAnnotations(
          {
            url:         tweet.url,
            tweetId:     tweet.id,
            annotatedBy: email,
            ownerGroups: this._pref.groups,
            annotations: JSON.stringify(annotations)
          }
        ));
        saved.then(i => this._cache.setCached("annotations-" + tweet.id, i, 24 * 60 * 60 * 1000));
        return await saved;

      } else {
        const mergedAnnotations = JSON.stringify({...JSON.parse(result[0].annotations), ...annotations});
        const saved = DataStore.save(GroupTweetAnnotations.copyOf(result[0], m => {
          m.annotations = mergedAnnotations;
          m.annotatedBy = email;
        }));
        saved.then(i => this._cached[tweet.id] = i);
        return await saved;
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
      delete this._cached[tweet.id];
      return await DataStore.delete(GroupTweetAnnotations,
                                    q => q.tweetId("eq", tweet.id)
                                          .ownerGroups("contains", this._pref.groups[0])
      );
    } catch (e) {
      log.error(e);
      this._notify.show("Failed to remove annotations for Tweet, this could be a network error. Refresh the page and" +
                          " try" +
                          " again, if this persists please contact support.", "OK", 60);
    }
  }

  private async updateCache() {
    return await DataStore.query(GroupTweetAnnotations,
                                 q => q.ownerGroups("contains", this._pref.groups[0]))
                          .then(result => {
                            log.debug(result);
                            if (result.length === 0) {
                              return null;
                            } else {
                              result.forEach(i => this._cached[i.tweetId] = i);
                            }
                          });
  }

}
