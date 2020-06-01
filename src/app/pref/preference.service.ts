import {Injectable} from '@angular/core';
import {Logger} from "aws-amplify";
import {APIService} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {Tweet} from "../map/twitter/tweet";

const log = new Logger('pref-service');

@Injectable({
              providedIn: 'root'
            })
export class PreferenceService {
  private _preferences: any;
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

  constructor(private _notify: NotificationService, private _api: APIService) { }

  public async init(userInfo: any) {
    this._userInfo = userInfo;
    log.debug("** Preference Service Initializing **");
    log.debug(userInfo);
    try {
      const pref = await this._api.GetUserPreferences(userInfo.username);
      if (!pref) {
        log.debug("No existing preferences.");
        this._api.CreateUserPreferences({id: userInfo.username});
        log.debug("Created new preferences.");
        this._preferences = await this._api.GetUserPreferences(userInfo.username);
      } else {
        log.debug("Existing preferences.");
        this._preferences = pref;

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
    // const result2 = await API.graphql(graphqlOperation(listTweetIrrelevants));
    // if(result2.data.listTweetIrrelevants) {
    //   this._tweetBlackList.push(...result2.data.listTweetIrrelevants.items.map(i => i.tweetId));
    // }
    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    const userIgnores = await this._api.ListTwitterUserIgnores(null, 10000);
    if (userIgnores) {
      this._twitterUserBlackList.push(...userIgnores.items.map(i => i.twitterScreenName));
    }
    log.debug(this._tweetBlackList);
    log.debug(this._twitterUserBlackList);

  }
  public clear() {
    this._preferences = null;
  }

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


  private async checkInit() {
    await this._username;
  }

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



  public isSenderIgnored(tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to check ignored sender on an unparseable tweet.");
      return;
    }

    return this._twitterUserBlackList.includes(tweet.sender);
  }

  public isTweetIgnored(tweet: Tweet) {
    if (!tweet.valid) {
      this._notify.error("Shouldn't be trying to ignore tweet on an unparseable tweet.");
      return;
    }
    return this._tweetBlackList.includes(tweet.id);
  }

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
}
