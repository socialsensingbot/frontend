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

  constructor(private _notification: NotificationService) { }

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
      console.error(e);
    }
  }

  public isBlacklisted(tweet: string): boolean {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      return false;
    }
    return this._tweetBlackList.includes(parsed.tweet) || this._twitterUserBlackList.includes(parsed.sender);
  }

  private async readBlacklist() {
    //todo: this is a hardcoded limit to fix https://github.com/socialsensingbot/frontend/issues/87
    const result = await API.graphql(graphqlOperation(listTweetIgnores,{limit:10000}));
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

  public async ignoreSender(tweet: string) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to ignore sender on an unparseable tweet.");
      return;
    }
    //#87 the value of the await needs to be in a temp variable
    const username = await this._username;
    const id = username + ":" + parsed.sender;
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    log.debug(result);
    if (!result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(createTwitterUserIgnore, {
        input: {
          id:                      id,
          twitterScreenName:       parsed.sender,
          twitterUserIgnoreUserId: username
        }
      }));
    } else {
      this._notification.show("Already ignoring @" + parsed.sender)
    }
    this._twitterUserBlackList.push(parsed.sender);
  }


  private async checkInit() {
    await this._username;
  }

  public async ignoreTweet(tweet: string) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to ignore tweet on an unparseable tweet.");
      return;
    }

    const username = await this._username;
    const id = username + ":" + parsed.tweet;
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    log.debug(result);
    if (!result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(createTweetIgnore, {
        input: {
          id,
          url:               parsed.url,
          tweetId:           parsed.tweet,
          tweetIgnoreUserId: username
        }
      }));
    } else {
      this._notification.show("Already ignoring " + parsed.tweet);
    }
    this._tweetBlackList.push(parsed.tweet);
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
  //     this._notification.show("Already marked irrelevant " + parsed.tweet);
  //   }
  //
  // }

  public parseTweet(blockquote: string) : {tweet:string, sender: string, url: string} | null {
    //https://twitter.com/crickhowellhs/status/1051548078199717888?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1051548078199717888&ref_url=http%3A%2F%2Flocalhost%3A4200%2Fmap%3Fselected%3Dpowys%26min_offset%3D-3119%26max_offset%3D0

    // log.debug(tweetURL);
    const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
    const matched = blockquote.match(regex);
    if (matched == null) {
      return null;
    }
    const sender = matched[1];
    const tweet = matched[2];
    return {tweet, sender, url: "https://twitter.com/" + sender + "status/" + tweet};
  }

  public isSenderIgnored(tweet) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to check ignored sender on an unparseable tweet.");
      return;
    }

    return this._twitterUserBlackList.includes(parsed.sender);
  }

  public isTweetIgnored(tweet) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to ignore tweet on an unparseable tweet.");
      return;
    }
    return this._tweetBlackList.includes(parsed.tweet);
  }

  public async unIgnoreSender(tweet) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to un-ignore sender on an unparseable tweet.");
      return;
    }

    this._twitterUserBlackList = this._twitterUserBlackList.filter(i => i !== parsed.sender);
    const id = (await this._username) + ":" + parsed.sender;
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    log.debug(result);
    if (result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTwitterUserIgnore, {input: {id}}));
    } else {
      this._notification.show("Not ignoring @" + parsed.sender)
    }
  }

  public async unIgnoreTweet(tweet) {
    const parsed = this.parseTweet(tweet);
    if(parsed == null) {
      console.error("Shouldn't be trying to un-ignore tweet on an unparseable tweet.");
      return;
    }

    const id = (await this._username) + ":" + parsed.tweet;
    this._tweetBlackList = this._tweetBlackList.filter(i => i !== parsed.tweet);
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    log.debug(result);
    if (result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTweetIgnore, {input: {id}}));
      log.debug(result);
    } else {
      this._notification.show("Not ignoring " + parsed.tweet);
    }
  }
}
