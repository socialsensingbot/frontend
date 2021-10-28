import {EventEmitter, Injectable} from "@angular/core";
import {Logger} from "@aws-amplify/core";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {environment} from "../../environments/environment";
import {DataStore, OpType} from "@aws-amplify/datastore";
import {GroupPreferences, GroupTweetIgnore, GroupTwitterUserIgnore, UserPreferences} from "../../models";
import Auth from "@aws-amplify/auth";
import {SSMapLayer} from "../types";

const log = new Logger("pref-service");

@Injectable({
                providedIn: "root"
            })
export class PreferenceService {
    public tweetIgnored = new EventEmitter<GroupTweetIgnore>();
    public twitterUserIgnored = new EventEmitter<GroupTwitterUserIgnore>();
    public tweetUnignored = new EventEmitter<GroupTweetIgnore>();
    public twitterUserUnignored = new EventEmitter<GroupTwitterUserIgnore>();
    public ready: boolean;
    private _preferences: any;
    private _groupPreferences: GroupPreferences;
    private _readyPromise: Promise<boolean> = new Promise<boolean>((resolve) => {
        const loop = () => {
            if (this.ready) {
                resolve(true);
            } else {
                log.verbose("Waiting for ready.");
                setTimeout(loop, 100);
            }
        };
        setTimeout(loop, 50);
    });
    private _tweetBlackList: string[] = [];
    private _twitterUserBlackList: string[] = [];
    private _userInfo: any = null;
    // todo: There must be a better way to do this!
    public username: Promise<string> = new Promise<string>((resolve) => {
        const loop = () => {
            if (this._userInfo != null) {
                log.debug("Resolved username " + this._userInfo.username);
                resolve(this._userInfo.username);
            } else {
                log.verbose("Waiting for username.");
                setTimeout(loop, 100);
            }
        };
        setTimeout(loop, 50);
    });
    public environment: any;

    constructor(private _notify: NotificationService) {
        this._combined = {...environment};
        this.environment = environment;
    }

    private _combined: any;

    public get combined(): any {
        if (!this.ready) {
            throw new Error(
                `Attempted to access preferences before preference service is ready. Make sure you call 'await preferenceService.waitUntilReady() before accessing the 'combined' member variable.`
            );
        }
        return this._combined;
    }

    public set combined(value: any) {
        this._combined = value;
    }

    private _groups: string[] = [];

    public get groups(): string[] {
        return this._groups;
    }

    private static combine(...prefs: any) {
        const result = {};
        for (const pref of prefs) {
            for (const field in pref) {
                if (pref.hasOwnProperty(field)
                    && !field.startsWith("__")
                    && typeof pref[field] !== "undefined"
                    && pref[field] !== null) {
                    result[field] = pref[field];
                }
            }
        }
        return result;
    }

    public async init(userInfo: any) {
        this._userInfo = userInfo;
        const groups = (await Auth.currentAuthenticatedUser()).signInUserSession.accessToken.payload["cognito:groups"];
        if (!groups || groups.length === 1) {
            this._groups = groups;
        } else {
            log.error("User is a member of more than one group (not supported)");
        }
        log.debug("** Preference Service Initializing **");
        log.debug(userInfo);
        try {
            log.debug("Making sure storage is ready.");
            const pref = await DataStore.query(UserPreferences, q => q.owner("eq", userInfo.username));
            if (!pref) {
                log.debug("No existing preferences.");
                this._preferences = await DataStore.save(new UserPreferences({owner: userInfo.username}));
                log.debug("Created new preferences.");
            } else {
                log.debug("Existing preferences", pref);
                this._preferences = pref;

            }
            if (!groups || groups.length === 0) {
                this._notify.show(
                    // tslint:disable-next-line:max-line-length
                    "Your account is not a member of a group, please ask an administrator to fix this. The application will not work correctly until you do.",
                    "I Will",
                    180);
                this._groups = ["__invalid__"];
                return;
            } else {
                const groupPref = await DataStore.query(GroupPreferences, q => q.group("eq", this._groups[0]));
                if (groupPref.length === 0) {
                    log.debug("No existing preferences.");

                    log.debug("Created new group preferences.");
                    this._groupPreferences = await DataStore.save(
                        new GroupPreferences({group: this._groups[0]}));
                } else {
                    log.debug("Existing group preferences.");
                    this._groupPreferences = groupPref[0];

                }
                try {
                    log.debug("GROUP PREFS", this._groupPreferences.prefs);
                    let groupPrefs: any = {};
                    if (this._groupPreferences.prefs) {
                        groupPrefs = typeof this._groupPreferences.prefs !== "undefined" ?
                            JSON.parse(this._groupPreferences.prefs) : this._groupPreferences;
                    }
                    log.debug("USER PREFS", this._preferences.prefs);
                    let prefs: any = {};
                    if (this._preferences.prefs) {
                        prefs = typeof this._preferences.prefs !== "undefined" ?
                            JSON.parse(this._preferences.prefs) : this._preferences;
                    }
                    this._combined = PreferenceService.combine(this._combined, prefs, groupPrefs);
                } catch (e) {
                    log.error(
                        "Defaulting to environment preferences most probably we couldn't parse the preferences, check the stack trace below.");
                    log.error(e);
                }


                log.info("Combined preferences are: ", this._combined);
            }

            try {
                log.info("Loading the ignores list");
                await this.readBlacklist();
                log.info("Loaded the ignores list");
            } catch (e) {
                log.error(e);
                this._notify.show(
                    "Failed to load the ignores list, this could be a network error. Refresh the page and try" +
                    " again.", "OK", 60);
            } finally {
                this.ready = true;
            }

        } catch (e) {
            log.error(e);

        }
        log.info("Preference Service Initialized");


    }

    public isBlacklisted(tweet: Tweet): boolean {
        if (!tweet.valid) {
            return false;
        }
        if (!this.ready) {
            throw new Error("Preference service not initialized");
        }
        return this._tweetBlackList.includes(tweet.id) || this._twitterUserBlackList.includes(tweet.sender);
    }

    public clear() {
        this._preferences = null;
    }

    public async groupIgnoreSender(tweet: Tweet) {
        try {
            return await this.ignoreSenderForScope(tweet, this.groupScope());
        } catch (e) {
            log.error(e);
            this._notify.show("Failed to ignore Twitter user, this could be a network error. Refresh the page and try" +
                                  " again, if this persists please contact support.", "OK", 60_000);
        }
    }

    public async waitUntilReady() {
        return this._readyPromise;
    }

    public async groupIgnoreTweet(tweet: Tweet) {
        try {
            return await this.ignoreTweetForScope(tweet, this.groupScope());
        } catch (e) {
            log.error(e);
            this._notify.show("Failed to ignore Tweet, this could be a network error. Refresh the page and try" +
                                  " again, if this persists please contact support.", "OK", 60_000);
        }

    }

    public isSenderIgnored(tweet) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to check ignored sender on an unparseable tweet.");
            return;
        }

        return this._twitterUserBlackList.includes(tweet.sender);
    }

    public isTweetIgnored(tweet: Tweet) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to check tweet ignored on an unparseable tweet.");
            return;
        }
        return this._tweetBlackList.includes(tweet.id);
    }

    public async groupUnIgnoreSender(tweet) {
        try {
            return await this.unignoreSenderForScope(tweet, this.groupScope());
        } catch (e) {
            log.error(e);
            this._notify.show(
                "Failed to un-ignore Twitter user, this could be a network error. Refresh the page and try" +
                " again, if this persists please contact support.", "OK", 60_000);
        }
    }

    public async groupUnIgnoreTweet(tweet) {
        try {
            return await this.unignoreTweetForScope(tweet, this.groupScope());
        } catch (e) {
            log.error(e);
            log.error(JSON.stringify(e));
            this._notify.show("Failed to un-ignore Tweet, this could be a network error. Refresh the page and try" +
                                  " again, if this persists please contact support.", "OK", 60_000);
        }
    }

    private async readBlacklist() {
        let page = 0;
        //This is the maximum allowable calls to the datastore, more than this means a bug has crept in
        let safety = 10000;
        const pageSize = 1000;
        while (safety-- > 0) {
            const groupTweetIgnores = await DataStore.query(GroupTweetIgnore,
                                                            q => q.or(
                                                                g => g.scope("eq", this.groupScope())),
                                                            {limit: pageSize, page});
            log.info(`Reading page ${page} of GroupTweetIgnore size was ${groupTweetIgnores.length}`);
            log.info(groupTweetIgnores);
            this._tweetBlackList.push(...groupTweetIgnores.map(i => i.tweetId));
            if (groupTweetIgnores.length === pageSize) {
                page++;
            } else {
                break;
            }
        }
        if (safety === 0) {
            log.error("Potential infinite loop detected while reading GroupTweetIgnore");
        }
        page = 0;
        safety = 10000;
        while (safety-- > 0) {
            log.info(`Reading page ${page} of GroupTwitterUserIgnore`);
            const groupUserIgnores = await DataStore.query(GroupTwitterUserIgnore,
                                                           q => q.or(g => g.scope("eq", this.groupScope())),
                                                           {limit: 1000, page});
            this._twitterUserBlackList.push(...groupUserIgnores.map(i => i.twitterScreenName));
            if (groupUserIgnores.length === pageSize) {
                page++;
            } else {
                break;
            }
        }
        if (safety === 0) {
            log.error("Potential infinite loop detected while reading GroupTwitterUserIgnore");
        }

        log.debug("Blacklist", this._tweetBlackList);
        log.debug(this._tweetBlackList);
        log.debug(this._twitterUserBlackList);
        //Dirty hack to make sure the tweets list is up to dayte. Consider a better route.
        this.tweetIgnored.emit(null);

        DataStore.observe(GroupTweetIgnore).subscribe((msg) => {
            const sub: GroupTweetIgnore = msg.element;
            log.debug("New tweet ignore detected ");
            if (!sub.id) {
                log.warn("Invalid id for sub", sub);
            }
            if (this.isInScope(sub)) {
                if (msg.opType === OpType.DELETE) {
                    log.debug("New tweet unignore is meant for us.", sub);
                    this._tweetBlackList = this._tweetBlackList.filter(i => i !== sub.tweetId);
                    this.tweetUnignored.emit(sub);
                } else {
                    log.debug("New tweet ignore is meant for us.", sub);
                    this._tweetBlackList.push(sub.tweetId);
                    this.tweetIgnored.emit(sub);
                }
            } else {
                log.debug(`Ignoring out of scope tweet ignore from scope ${sub.scope}`);
            }
        });

        DataStore.observe(GroupTwitterUserIgnore).subscribe((msg) => {
            const sub = msg.element;
            log.debug("New twitter user ignore detected ");
            if (!sub.id) {
                log.warn("Invalid id for sub", sub);
            }
            if (this.isInScope(sub)) {
                if (msg.opType === OpType.DELETE) {
                    log.debug("New twitter user unignore is meant for us.", sub);
                    this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== sub.twitterScreenName);
                    this.twitterUserUnignored.emit(sub);

                } else {
                    log.debug("New twitter user ignore is meant for us.", sub);
                    this._twitterUserBlackList.push(sub.twitterScreenName);
                    this.twitterUserIgnored.emit(sub);
                }
            } else {
                log.debug(`Ignoring out of scope twitter user ignore from scope ${sub.scope}`);
            }
        });


    }

    private isInScope(sub: any) {
        return sub.scope === "*" || sub.scope === this.groupScope();
    }

    private groupScope() {
        if (this._groups && this._groups.length > 0) {
            return "group:" + this._groups[0];
        } else {
            return "group:_unknown_";
        }
    }

    private async ignoreSenderForScope(tweet: Tweet, scope: string) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to group ignore sender on an unparseable tweet.");
            return;
        }
        // #87 the value of the await needs to be in a temp variable
        const username = await this.username;
        const id = scope + ":" + tweet.sender;
        const result = await DataStore.query(GroupTwitterUserIgnore, q => q.twitterScreenName("eq", tweet.sender)
                                                                           .ownerGroups("contains", this._groups[0]));
        log.debug(result);
        if (result.length === 0) {
            await DataStore.save(new GroupTwitterUserIgnore(
                {
                    twitterScreenName: tweet.sender,
                    ignoredBy:         this._userInfo.attributes.email,
                    ownerGroups:       this._groups,
                    scope
                }
            ));
        } else {
            this._notify.show("Already ignoring @" + tweet.sender);
        }
        this._twitterUserBlackList.push(tweet.sender);
    }

    private async checkInit() {
        await this.username;
    }

    private async ignoreTweetForScope(tweet: Tweet, scope: string) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to (group) ignore tweet on an unparseable tweet.");
            return;
        }

        const username = await this.username;
        const id = scope + ":" + tweet.id;
        const result = await DataStore.query(GroupTweetIgnore, q => q.tweetId("eq", tweet.sender)
                                                                     .ownerGroups("contains", this._groups[0]));
        log.debug(result);
        if (result.length === 0) {
            await DataStore.save(new GroupTweetIgnore(
                {
                    url:         tweet.url,
                    tweetId:     tweet.id,
                    ignoredBy:   this._userInfo.attributes.email,
                    ownerGroups: this._groups,
                    scope
                }
            ));

        } else {
            this._notify.show("Already ignoring " + tweet.id);
        }
        this._tweetBlackList.push(tweet.id);
    }

    private async unignoreSenderForScope(tweet, scope: string) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to (group) un-ignore sender on an unparseable tweet.");
            return;
        }

        // this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== tweet.sender);
        await this.username;
        await DataStore.delete(GroupTwitterUserIgnore,
                               q => q.twitterScreenName("eq", tweet.sender).ownerGroups("contains", this._groups[0]));
    }

    private async unignoreTweetForScope(tweet, scope: string) {
        if (!tweet.valid) {
            throw new Error("Shouldn't be trying to (group) un-ignore tweet on an unparseable tweet.");
            return;
        }
        await this.username;
        await DataStore.delete(GroupTweetIgnore,
                               q => q.tweetId("eq", tweet.id).ownerGroups("contains", this._groups[0]));
    }

    public featureSupported(feature: string): boolean {
        return this.combined.features.includes(feature);
    }

    public defaultLayer(): SSMapLayer {
        const defaultLayer: SSMapLayer = this.combined.layers.available.filter(i => i.id === this.combined.layers.defaultLayer)[0];
        if (!defaultLayer) {
            throw new Error(
                "Configuration specifies " + this.combined.layers.defaultLayer + " as default layer, no such layer exists in " + JSON.stringify(
                    this.combined.layers));
        }
        return defaultLayer;
    }
}
