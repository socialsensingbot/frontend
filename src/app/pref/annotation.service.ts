import {EventEmitter, Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {DataStore, OpType} from "@aws-amplify/datastore";
import {GroupTweetAnnotations} from "../../models";
import {PreferenceService} from "./preference.service";
import {AuthService} from "../auth/auth.service";
import {NgForageCache} from "ngforage";

const log = new Logger("annotation-service");

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
        this._observable = DataStore.observe(GroupTweetAnnotations,
                                             q => q.ownerGroups("contains", this._pref.groups[0]));

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

        log.debug("Cached tweet was ", this._cached[tweet.id]);
        return this._cached[tweet.id] || null;
    }


    public async addAnnotations(tweet: Tweet, annotations: any): Promise<GroupTweetAnnotations> {
        await this.waitUntilReady();
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to annotate an unparseable tweet.");
            return;
        }
        try {

            const result = await this.getAnnotations(tweet);
            log.debug("Annotation: ", result);
            const email = await this._auth.email();
            if (typeof result === "undefined" || result === null) {
                log.info("No annotations returned ", result);
                const saved = DataStore.save(new GroupTweetAnnotations(
                    {
                        url:         tweet.url,
                        tweetId:     tweet.id,
                        annotatedBy: email,
                        ownerGroups: this._pref.groups,
                        annotations: JSON.stringify(annotations)
                    }
                ));
                saved.then(i => this._cached[tweet.id] = i);
                return await saved;

            } else {
                let mergedAnnotations: string;
                if (typeof result.annotations === "string") {
                    mergedAnnotations = JSON.stringify({...JSON.parse(result.annotations), ...annotations});
                } else {
                    mergedAnnotations = JSON.stringify({...(result.annotations as any), ...annotations});

                }
                const saved = DataStore.save(GroupTweetAnnotations.copyOf(result, m => {
                    m.annotations = mergedAnnotations;
                    m.annotatedBy = email;
                }));
                saved.then(i => this._cached[tweet.id] = i);
                return await saved;
            }
        } catch (e) {
            log.error(e);
            this._notify.show("Failed to annotate Tweet, this could be a network error. Refresh the page and try" +
                                  " again, if this persists please contact support.", "OK", 60_000);
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
            this._notify.show(
                "Failed to remove annotations for Tweet, this could be a network error. Refresh the page and" +
                " try" +
                " again, if this persists please contact support.", "OK", 60);
        }
    }

    private async updateCache() {
        return await DataStore.query(GroupTweetAnnotations,
                                     q => q.ownerGroups("contains", this._pref.groups[0]))
                              .then(result => {
                                  log.debug("Updated cache with", result);
                                  if (!result || result.length === 0) {
                                      return null;
                                  } else {
                                      result.forEach(i => this._cached[i.tweetId] = i);
                                  }
                              });
    }

}
