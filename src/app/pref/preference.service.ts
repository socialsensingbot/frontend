import {Injectable} from '@angular/core';
import {Auth, Logger} from "aws-amplify";
import {APIService} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";

const log = new Logger('pref-service');

@Injectable({
              providedIn: 'root'
            })
export class PreferenceService {
  private _preferences: any;
  private _groupPreferences: any;
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

  constructor(private _notify: NotificationService, private _api: APIService) { }

  public async init(userInfo: any) {
    this._userInfo = userInfo;
    const groups = (await Auth.currentAuthenticatedUser()).signInUserSession.accessToken.payload["cognito:groups"];
    this._email = userInfo.attributes.email;
    if (!groups || groups.length === 1) {
      this._groups = groups;
    } else if (groups.length === 0) {
      this._groups = ["testuser"]
    } else {
      log.error("User is a member of more than one group (not supported)");
    }
    log.debug("** Preference Service Initializing **");
    log.debug(userInfo);
    try {
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
      log.debug(this._preferences);
      this.readBlacklist();
      log.debug("** Preference Service Initialized **");
    } catch (e) {
      log.debug("** Preferences Service Failed to Initialize **");
      this._notify.error(e);
    }
  }

  public isBlacklisted(tweet: Tweet): boolean {
    if (!tweet.valid) {
      return false;
    }
    return this._tweetBlackList.includes(tweet.id) || this._twitterUserBlackList.includes(tweet.sender);
  }

  private async readBlacklist() {
    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    const tweetIgnores = await this._api.ListTweetIgnores(null, 10000);
    if (tweetIgnores) {
      this._tweetBlackList.push(...tweetIgnores.items.map(i => i.tweetId));
    }

    const userIgnores = await this._api.ListTwitterUserIgnores(null, 10000);
    if (userIgnores) {
      this._twitterUserBlackList.push(...userIgnores.items.map(i => i.twitterScreenName));
    }

    const groupTweetIgnores = await this._api.ListGroupTweetIgnores(null, 10000);
    if (groupTweetIgnores) {
      this._tweetBlackList.push(...groupTweetIgnores.items.map(i => i.tweetId));
    }

    const groupUserIgnores = await this._api.ListGroupTwitterUserIgnores(null, 10000);
    if (groupUserIgnores) {
      this._twitterUserBlackList.push(...groupUserIgnores.items.map(i => i.twitterScreenName));
    }

    log.debug(this._tweetBlackList);
    log.debug(this._twitterUserBlackList);


    //////// TODO: ADD SUBSCRIPTION ////////////////
    //////// TODO: ADD SUBSCRIPTION ////////////////
    //////// TODO: ADD SUBSCRIPTION ////////////////

  }

  public clear() {
    this._preferences = null;
  }

  /**
   * @deprecated use groupIgnoreSender
   * @param tweet
   */
  public async ignoreSender(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to ignore sender on an unparseable tweet.");
      return;
    }
    //#87 the value of the await needs to be in a temp variable
    const username = await this._username;
    const id = username + ":" + tweet.sender;
    const result = await this._api.GetTwitterUserIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateTwitterUserIgnore(
        {
          id:                      id,
          twitterScreenName:       tweet.sender,
          twitterUserIgnoreUserId: username
        }
      );
    } else {
      this._notify.show("Already ignoring @" + tweet.sender)
    }
    this._twitterUserBlackList.push(tweet.sender);
  }

  public async groupIgnoreSender(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to group ignore sender on an unparseable tweet.");
      return;
    }
    //#87 the value of the await needs to be in a temp variable
    const username = await this._username;
    const id = this._groups[0] + ":" + tweet.sender;
    const result = await this._api.GetGroupTwitterUserIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateGroupTwitterUserIgnore(
        {
          id:                id,
          twitterScreenName: tweet.sender,
          ignoredBy:         this._email,
          ownerGroups:       this._groups
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

  /**
   * @deprecated use groupIgnoreTweet
   * @param tweet
   */
  public async ignoreTweet(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to ignore tweet on an unparseable tweet.");
      return;
    }

    const username = await this._username;
    const id = username + ":" + tweet.id;
    const result = await this._api.GetTweetIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateTweetIgnore(
        {
          id,
          url:               tweet.url,
          tweetId:           tweet.id,
          tweetIgnoreUserId: username
        }
      );

    } else {
      this._notify.show("Already ignoring " + tweet.id);
    }
    this._tweetBlackList.push(tweet.id);
  }

  public async groupIgnoreTweet(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to (group) ignore tweet on an unparseable tweet.");
      return;
    }

    const username = await this._username;
    const id = this._groups[0] + ":" + tweet.id;
    const result = await this._api.GetGroupTweetIgnore(id);
    log.debug(result);
    if (!result) {
      const result = this._api.CreateGroupTweetIgnore(
        {
          id,
          url:         tweet.url,
          tweetId:     tweet.id,
          ignoredBy:   this._email,
          ownerGroups: this._groups
        }
      );

    } else {
      this._notify.show("Already ignoring " + tweet.id);
    }
    this._tweetBlackList.push(tweet.id);
  }


  public isSenderIgnored(tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to check ignored sender on an unparseable tweet.");
      return;
    }

    return this._twitterUserBlackList.includes(tweet.sender);
  }

  public isTweetIgnored(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to check tweet ignored on an unparseable tweet.");
      return;
    }
    return this._tweetBlackList.includes(tweet.id);
  }

  /**
   * @deprecated use groupUnignoreSender
   * @param tweet
   */
  public async unIgnoreSender(tweet) {

    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to un-ignore sender on an unparseable tweet.");
      return;
    }

    this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== tweet.sender);
    const id = (await this._username) + ":" + tweet.sender;
    const result = await this._api.GetTwitterUserIgnore(id);
    log.debug(result);
    if (result) {
      await this._api.DeleteTwitterUserIgnore({id});
    } else {
      this._notify.show("Not ignoring @" + tweet.sender)
    }
  }

  public async groupUnIgnoreSender(tweet) {

    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to (group) un-ignore sender on an unparseable tweet.");
      return;
    }

    this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== tweet.sender);
    await this._username;
    const id = this._groups[0] + ":" + tweet.sender;
    const result = await this._api.GetGroupTwitterUserIgnore(id);
    log.debug(result);
    if (result) {
      await this._api.DeleteGroupTwitterUserIgnore({id});
    } else {
      this._notify.show("Not ignoring @" + tweet.sender)
    }
  }

  /**
   * @deprecated use groupUnignoreTweet
   * @param tweet
   */
  public async unIgnoreTweet(tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to un-ignore tweet on an unparseable tweet.");
      return;
    }

    const id = (await this._username) + ":" + tweet.id;
    this._tweetBlackList = this._tweetBlackList.filter(i => i !== tweet.id);
    const result = await this._api.GetTweetIgnore(id);
    log.debug(result);
    if (result) {
      await this._api.DeleteTweetIgnore({id});
      log.debug(result);
    } else {
      this._notify.show("Not ignoring " + tweet.id);
    }
  }

  public async groupUnIgnoreTweet(tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to (group) un-ignore tweet on an unparseable tweet.");
      return;
    }
    await this._username;
    const id = this._groups[0] + ":" + tweet.id;
    this._tweetBlackList = this._tweetBlackList.filter(i => i !== tweet.id);
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
