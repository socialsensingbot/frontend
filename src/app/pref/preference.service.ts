import {EventEmitter, Injectable} from '@angular/core';
import {Auth, Logger} from "aws-amplify";
import {
  APIService, GetGroupPreferencesQuery,
  OnCreateGroupTweetIgnoreSubscription,
  OnCreateGroupTwitterUserIgnoreSubscription,
  OnDeleteGroupTweetIgnoreSubscription,
  OnDeleteGroupTwitterUserIgnoreSubscription
} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";
import {environment} from "../../environments/environment";

const log = new Logger('pref-service');

@Injectable({
              providedIn: 'root'
            })
export class PreferenceService {
  public get groups(): string[] {
    return this._groups;
  }

  private _preferences: any;
  private _groupPreferences: GetGroupPreferencesQuery;
  //todo: There must be a better way to do this!
  private _username: Promise<string> = new Promise<string>((resolve) => {
    const loop = () => {
      if (this._userInfo != null) {
        log.debug("Resolved username " + this._userInfo.username);
        resolve(this._userInfo.username)
      } else {
        log.verbose("Waiting for username.");
        setTimeout(loop, 100);
      }
    };
    setTimeout(loop, 50);
  });
  private _tweetBlackList: string[] = [];
  private _twitterUserBlackList: string[] = [];
  private _userInfo: any = null;
  private _groups: string[] = [];
  private _email: string;

  public tweetIgnored = new EventEmitter<OnCreateGroupTweetIgnoreSubscription>();
  public twitterUserIgnored = new EventEmitter<OnCreateGroupTwitterUserIgnoreSubscription>();
  public tweetUnignored = new EventEmitter<OnDeleteGroupTweetIgnoreSubscription>();
  public twitterUserUnignored = new EventEmitter<OnDeleteGroupTwitterUserIgnoreSubscription>();

  public group: any;

  constructor(private _notify: NotificationService, private _api: APIService) {
    this.group = {...environment};
  }

  public async init(userInfo: any) {
    this._userInfo = userInfo;
    const groups = (await Auth.currentAuthenticatedUser()).signInUserSession.accessToken.payload["cognito:groups"];
    this._email = userInfo.attributes.email;
    if (!groups || groups.length === 1) {
      this._groups = groups;
    } else {
      log.error("User is a member of more than one group (not supported)");
    }
    log.debug("** Preference Service Initializing **");
    log.debug(userInfo);

    const pref = await this._api.GetUserPreferences(userInfo.username);
    if (!pref) {
      log.debug("No existing preferences.");
      await this._api.CreateUserPreferences({id: userInfo.username});
      log.debug("Created new preferences.");
      this._preferences = await this._api.GetUserPreferences(userInfo.username);
    } else {
      log.debug("Existing preferences.");
      this._preferences = pref;

    }
    if (!groups || groups.length === 0) {
      this._notify.show(
        // tslint:disable-next-line:max-line-length
        "Your account is not a member of a group, please ask an administrator to fix this. The application will not work correctly until you do.",
        "I Will",
        180);
      this._groups = ["__invalid__"];
    } else {
      const groupPref = await this._api.GetGroupPreferences(this._groups[0]);
      if (!groupPref) {
        log.debug("No existing preferences.");
        await this._api.CreateGroupPreferences({id: this._groups[0], group: this._groups[0]});
        log.debug("Created new group preferences.");
        this._groupPreferences = await this._api.GetGroupPreferences(this._groups[0]);
      } else {
        log.debug("Existing group preferences.");
        this._groupPreferences = groupPref;

      }
      this.group = {...this.group, ...this._groupPreferences};
      if (!this.group.availableDataSets) {
        this.group.availableDataSets = environment.availableDataSets;
      }
      if (!this.group.defaultDataSet) {
        this.group.defaultDataSet = environment.defaultDataSet;
      }
      log.debug(this._preferences);
    }
    this.readBlacklist();
    log.info("Preference Service Initialized");


  }

  public isBlacklisted(tweet: Tweet): boolean {
    if (!tweet.valid) {
      return false;
    }
    return this._tweetBlackList.includes(tweet.id) || this._twitterUserBlackList.includes(tweet.sender);
  }

  private async readBlacklist() {
    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    //NB: Filtering for scope is done on the server
    const groupTweetIgnores = await this._api.ListGroupTweetIgnores(
      {or: [{scope: {eq: this.groupScope()}}, {scope: {eq: "*"}}]}, 10000);
    if (groupTweetIgnores) {
      this._tweetBlackList.push(...groupTweetIgnores.items.map(i => i.tweetId));
    }

    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    //NB: Filtering for scope is done on the server
    const groupUserIgnores = await this._api.ListGroupTwitterUserIgnores(
      {or: [{scope: {eq: this.groupScope()}}, {scope: {eq: "*"}}]}, 10000);
    if (groupUserIgnores) {
      this._twitterUserBlackList.push(...groupUserIgnores.items.map(i => i.twitterScreenName));
    }

    log.debug(this._tweetBlackList);
    log.debug(this._twitterUserBlackList);

    //TODO: Filtering here is done on the client see https://github.com/socialsensingbot/frontend/issues/114
    const onTweetIgnore = (subObj: any) => {
      const sub: OnCreateGroupTweetIgnoreSubscription = subObj.value.data.onCreateGroupTweetIgnore;
      log.debug("New tweet ignore detected ");
      if (!sub.id) {
        log.warn('Invalid id for sub', sub);
      }
      if (this.isInScope(sub)) {
        log.debug("New tweet ignore is meant for us.", sub);
        this._tweetBlackList.push(sub.tweetId);
        this.tweetIgnored.emit(sub);
      } else {
        log.debug(`Ignoring out of scope tweet ignore from scope ${sub.scope}`);
      }
    };

    this._api.OnCreateGroupTweetIgnoreListener.subscribe(onTweetIgnore);
    const onTwitterUser = (subObj: any) => {
      const sub: OnCreateGroupTwitterUserIgnoreSubscription = subObj.value.data.onCreateGroupTwitterUserIgnore;
      log.debug("New twitter user ignore detected ");
      if (!sub.id) {
        log.warn('Invalid id for sub', sub);
      }
      if (this.isInScope(sub)) {
        log.debug("New twitter user ignore is meant for us.", sub);
        this._twitterUserBlackList.push(sub.twitterScreenName);
        this.twitterUserIgnored.emit(sub);
      } else {
        log.debug(`Ignoring out of scope twitter user ignore from scope ${sub.scope}`);
      }
    };

    this._api.OnCreateGroupTwitterUserIgnoreListener.subscribe(onTwitterUser);


    const onTweetUnignore = (subObj: any) => {
      const sub: OnDeleteGroupTweetIgnoreSubscription = subObj.value.data.onDeleteGroupTweetIgnore;
      log.debug("New tweet unignore detected ");
      if (!sub.id) {
        log.warn('Invalid id for sub', sub);
      }
      if (this.isInScope(sub)) {
        log.debug("New tweet unignore is meant for us.", sub);
        this._tweetBlackList = this._tweetBlackList.filter(i => i !== sub.tweetId);
        this.tweetUnignored.emit(sub);
      } else {
        log.debug(`Ignoring out of scope tweet unignore from scope ${sub.scope}`);
      }
    };

    this._api.OnDeleteGroupTweetIgnoreListener.subscribe(onTweetUnignore);

    const onTwitterUserUnignore = (subObj: any) => {
      const sub: OnDeleteGroupTwitterUserIgnoreSubscription = subObj.value.data.onDeleteGroupTwitterUserIgnore;
      log.debug("New twitter user unignore detected ");
      if (!sub.id) {
        log.warn('Invalid id for sub', sub);
      }
      if (this.isInScope(sub)) {
        log.debug("New twitter user unignore is meant for us.", sub);
        this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== sub.twitterScreenName);
        this.twitterUserUnignored.emit(sub);
      } else {
        log.debug(`Ignoring out of scope twitter user unignore from scope ${sub.scope}`);
      }
    };

    this._api.OnDeleteGroupTwitterUserIgnoreListener.subscribe(onTwitterUserUnignore);
  }

  private isInScope(sub: any) {
    return sub.scope == "*" || sub.scope === this.groupScope();
  }

  private groupScope() {
    if (this._groups && this._groups.length > 0) {
      return "group:" + this._groups[0];
    } else {
      return "group:_unknown_";
    }
  }

  public clear() {
    this._preferences = null;
  }

  public async groupIgnoreSender(tweet: Tweet) {
    return await this.ignoreSenderForScope(tweet, this.groupScope());
  }


  private async ignoreSenderForScope(tweet: Tweet, scope: string) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to group ignore sender on an unparseable tweet.");
      return;
    }
    //#87 the value of the await needs to be in a temp variable
    const username = await this._username;
    const id = scope + ":" + tweet.sender;
    const result = await this._api.GetGroupTwitterUserIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateGroupTwitterUserIgnore(
        {
          id:                id,
          twitterScreenName: tweet.sender,
          ignoredBy:         this._email,
          ownerGroups:       this._groups,
          scope:             scope
        }
      );
    } else {
      this._notify.show("Already ignoring @" + tweet.sender)
    }
    this._twitterUserBlackList.push(tweet.sender);
  }

  private async checkInit() {
    await this._username;
  }


  public async groupIgnoreTweet(tweet: Tweet) {
    return await this.ignoreTweetForScope(tweet, this.groupScope());
  }


  private async ignoreTweetForScope(tweet: Tweet, scope: string) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to (group) ignore tweet on an unparseable tweet.");
      return;
    }

    const username = await this._username;
    const id = scope + ":" + tweet.id;
    const result = await this._api.GetGroupTweetIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateGroupTweetIgnore(
        {
          id,
          url:         tweet.url,
          tweetId:     tweet.id,
          ignoredBy:   this._email,
          ownerGroups: this._groups,
          scope:       scope
        }
      );

    } else {
      this._notify.show("Already ignoring " + tweet.id);
    }
    this._tweetBlackList.push(tweet.id);
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
    return await this.unignoreSenderForScope(tweet, this.groupScope());
  }

  private async unignoreSenderForScope(tweet, scope: string) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to (group) un-ignore sender on an unparseable tweet.");
      return;
    }

    // this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== tweet.sender);
    await this._username;
    const id = scope + ":" + tweet.sender;
    const result = await this._api.GetGroupTwitterUserIgnore(id);
    log.debug(result);
    if (result) {
      await this._api.DeleteGroupTwitterUserIgnore({id});
    } else {
      this._notify.show("Not ignoring @" + tweet.sender)
    }
  }

  public async groupUnIgnoreTweet(tweet) {
    return await this.unignoreTweetForScope(tweet, this.groupScope());
  }

  private async unignoreTweetForScope(tweet, scope: string) {
    if (!tweet.valid) {
      throw new Error("Shouldn't be trying to (group) un-ignore tweet on an unparseable tweet.");
      return;
    }
    await this._username;
    const id = scope + ":" + tweet.id;
    // this._tweetBlackList = this._tweetBlackList.filter(i => i !== tweet.id);
    const result = await this._api.GetGroupTweetIgnore(id);
    log.debug(result);
    if (result) {
      await this._api.DeleteGroupTweetIgnore({id});
      log.debug(result);
    } else {
      this._notify.show("Not ignoring " + tweet.id);
    }
  }
}
