import {Injectable} from '@angular/core';
import {API, graphqlOperation, Logger} from "aws-amplify";
import {
  getTweetIgnore,
  getTweetIrrelevant,
  getTwitterUserIgnore,
  getUserPreferences,
  listTweetIgnores, listTweetIrrelevants, listTwitterUserIgnores
} from "../../graphql/queries";
import {
  createTweetIgnore,
  createTweetIrrelevant,
  createTwitterUserIgnore,
  createUserPreferences, deleteTweetIgnore, deleteTwitterUserIgnore
} from "../../graphql/mutations";
import {GetUserPreferencesQuery} from "../API.service";
import {NotificationService} from "../services/notification.service";
import {BehaviorSubject, Observable} from "rxjs";
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

  constructor(private _notify: NotificationService) { }

  public async init(userInfo: any) {
    this._userInfo = userInfo;
    log.debug("** Preference Service Initializing **");
    log.debug(userInfo);
    try {
      const data: GetUserPreferencesQuery = await this.getUserPref(userInfo);
      if (!data) {
        log.debug("No existing preferences.");
        const newProfile = {
          input: {
            id: userInfo.username
          }
        };
        await API.graphql(graphqlOperation(createUserPreferences, newProfile));
        log.debug("Created new preferences.");
        this._preferences = (await this.getUserPref(userInfo)).getUserPreferences;
      } else {
        log.debug("Existing preferences.");
        this._preferences = data.getUserPreferences;

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
    const result = await API.graphql(graphqlOperation(listTweetIgnores, {limit: 10000}));
    if (result.data.listTweetIgnores) {
      this._tweetBlackList.push(...result.data.listTweetIgnores.items.map(i => i.tweetId));
    }
    // const result2 = await API.graphql(graphqlOperation(listTweetIrrelevants));
    // if(result2.data.listTweetIrrelevants) {
    //   this._tweetBlackList.push(...result2.data.listTweetIrrelevants.items.map(i => i.tweetId));
    // }
    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    const result3 = await API.graphql(graphqlOperation(listTwitterUserIgnores,{limit:10000}));
    if (result3.data.listTwitterUserIgnores) {
      this._twitterUserBlackList.push(...result3.data.listTwitterUserIgnores.items.map(i => i.twitterScreenName));
    }
    log.debug(this._tweetBlackList);
    log.debug(this._twitterUserBlackList);

  }

  private async getUserPref(userInfo: any): Promise<GetUserPreferencesQuery> {
    const result = await API.graphql(graphqlOperation(getUserPreferences, {id: userInfo.username}));
    log.debug("Retrieved preferences.");
    log.debug(result);
    return result.data;
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
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    log.debug(result);
    if (!result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(createTwitterUserIgnore, {
        input: {
          id:                      id,
          twitterScreenName:       tweet.sender,
          twitterUserIgnoreUserId: username
        }
      }));
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
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    log.debug(result);
    if (!result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(createTweetIgnore, {
        input: {
          id,
          url:               tweet.url,
          tweetId:           tweet.id,
          tweetIgnoreUserId: username
        }
      }));
    } else {
      this._notify.show("Already ignoring " + tweet.id);
    }
    this._tweetBlackList.push(tweet.id);
  }

  // public async markIrrelevant(tweet: string) {
  //   const parsed = this.parseTweet(tweet);
  //   if(parsed == null) {
  //     console.error("Shouldn't be trying to mark irrelevant tweet on an unparseable tweet.");
  //     return;
  //   }
  //
  //   const id = (await this._username) + ":" + parsed.tweet;
  //   const result = await API.graphql(graphqlOperation(getTweetIrrelevant, {id}));
  //   log.debug(result);
  //   if (!result.data.getTweetIrrelevant) {
  //     const result = await API.graphql(graphqlOperation(createTweetIrrelevant, {
  //       input: {
  //         id,
  //         url:                   parsed.url,
  //         tweetId:               parsed.tweet,
  //         tweetIrrelevantUserId: (await this._username)
  //       }
  //     }));
  //   } else {
  //     this._notify.show("Already marked irrelevant " + parsed.tweet);
  //   }
  //
  // }


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
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    log.debug(result);
    if (result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTwitterUserIgnore, {input: {id}}));
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
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    log.debug(result);
    if (result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTweetIgnore, {input: {id}}));
      log.debug(result);
    } else {
      this._notify.show("Not ignoring " + tweet.id);
    }
  }
}
