import {Injectable} from '@angular/core';
import {API, graphqlOperation} from "aws-amplify";
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
import { GetUserPreferencesQuery} from "../API.service";
import {NotificationService} from "../services/notification.service";


@Injectable({
              providedIn: 'root'
            })
export class PreferenceService {
  private _preferences: any;
  private _username: string;
  private _tweetBlackList: string[] = [];
  private _twitterUserBlackList: string[] = [];

  constructor(private _notification: NotificationService) { }

  public async init(userInfo: any) {
    console.log("** Preference Service Initializing **");
    console.log(userInfo);
    this._username = userInfo.username;
    try {
      const data: GetUserPreferencesQuery = await this.getUserPref(userInfo);
      if (!data) {
        console.log("No existing preferences.");
        const newProfile = {
          input: {
            id: userInfo.username
          }
        };
        await API.graphql(graphqlOperation(createUserPreferences, newProfile));
        console.log("Created new preferences.");
        this._preferences = (await this.getUserPref(userInfo)).getUserPreferences;
      } else {
        console.log("Existing preferences.");
        this._preferences = data.getUserPreferences;

      }
      console.log(this._preferences);
      this.readBlacklist();
      console.log("** Preference Service Initialized **");
    } catch (e) {
      console.log("** Preferences Service Failed to Initialize **");
      console.error(e);
    }
  }

  public isBlacklisted(tweet: string):boolean {
    const parsed = this.parseTweet(tweet);
    return this._tweetBlackList.includes(parsed.tweet) || this._twitterUserBlackList.includes(parsed.sender);
  }

  private async readBlacklist() {
    const result = await API.graphql(graphqlOperation(listTweetIgnores));
    if(result.data.listTweetIgnores) {
      this._tweetBlackList.push(...result.data.listTweetIgnores.items.map(i => i.tweetId));
    }
    // const result2 = await API.graphql(graphqlOperation(listTweetIrrelevants));
    // if(result2.data.listTweetIrrelevants) {
    //   this._tweetBlackList.push(...result2.data.listTweetIrrelevants.items.map(i => i.tweetId));
    // }
    const result3 = await API.graphql(graphqlOperation(listTwitterUserIgnores));
    if(result3.data.listTwitterUserIgnores) {
      this._twitterUserBlackList.push(...result3.data.listTwitterUserIgnores.items.map(i => i.twitterScreenName));
    }
    console.log(this._tweetBlackList);
    console.log(this._twitterUserBlackList);

  }

  private async getUserPref(userInfo: any): Promise<GetUserPreferencesQuery> {
    const result = await API.graphql(graphqlOperation(getUserPreferences, {id: userInfo.username}));
    console.log("Retrieved preferences.");
    console.log(result);
    return result.data;
  }

  public clear() {
    this._preferences = null;
  }

  public async ignoreSender(tweet: string) {
    const parsedURL = this.parseTweet(tweet);
    const id = this._username + ":" + parsedURL.sender;
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    console.log(result);
    if (!result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(createTwitterUserIgnore, {
        input: {
          id:                      id,
          twitterScreenName:       parsedURL.sender,
          twitterUserIgnoreUserId: this._username
        }
      }));
    } else {
      this._notification.show("Already ignoring @" + parsedURL.sender)
    }
    this._twitterUserBlackList.push(parsedURL.sender);
  }


  public async ignoreTweet(tweet: string) {
    const parsedURL = this.parseTweet(tweet);
    const id = this._username + ":" + parsedURL.tweet;
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    console.log(result);
    if (!result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(createTweetIgnore, {
        input: {
          id,
          url:               parsedURL.url,
          tweetId:           parsedURL.tweet,
          tweetIgnoreUserId: this._username
        }
      }));
    } else {
      this._notification.show("Already ignoring " + parsedURL.tweet);
    }
    this._tweetBlackList.push(parsedURL.tweet);
  }

  public async markIrrelevant(tweet: string) {
    const parsedURL = this.parseTweet(tweet);
    const id = this._username + ":" + parsedURL.tweet;
    const result = await API.graphql(graphqlOperation(getTweetIrrelevant, {id}));
    console.log(result);
    if (!result.data.getTweetIrrelevant) {
      const result = await API.graphql(graphqlOperation(createTweetIrrelevant, {
        input: {
          id,
          url:                   parsedURL.url,
          tweetId:               parsedURL.tweet,
          tweetIrrelevantUserId: this._username
        }
      }));
    } else {
      this._notification.show("Already marked irrelevant " + parsedURL.tweet);
    }

  }

  public parseTweet(blockquote: string) {
    //https://twitter.com/crickhowellhs/status/1051548078199717888?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1051548078199717888&ref_url=http%3A%2F%2Flocalhost%3A4200%2Fmap%3Fselected%3Dpowys%26min_offset%3D-3119%26max_offset%3D0

    // console.log(tweetURL);
    const regex = /.*<a href="https:\/\/twitter.com\/(\w+)\/status\/(\d+).*">.*<\/a><\/blockquote>/;
    const sender = blockquote.match(regex)[1];
    const tweet = blockquote.match(regex)[2];
    return {tweet, sender, url: "https://twitter.com/" + sender + "status/" + tweet};
  }

  public isSenderIgnored(tweet) {
    return this._twitterUserBlackList.includes(this.parseTweet(tweet).sender);
  }

  public isTweetIgnored(tweet) {
    return this._tweetBlackList.includes(this.parseTweet(tweet).tweet);
  }

  public async unIgnoreSender(tweet) {
    const parsedURL = this.parseTweet(tweet);
    const id = this._username + ":" + parsedURL.sender;
    const result = await API.graphql(graphqlOperation(getTwitterUserIgnore, {id}));
    console.log(result);
    if (result.data.getTwitterUserIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTwitterUserIgnore, { input: {id}}));
      console.log(result);
      this._twitterUserBlackList=this._twitterUserBlackList.filter(i=> i !== parsedURL.sender);
    } else {
      this._notification.show("Not ignoring @" + parsedURL.sender)
    }
  }

  public async unIgnoreTweet(tweet) {
    const parsedURL = this.parseTweet(tweet);
    const id = this._username + ":" + parsedURL.tweet;
    const result = await API.graphql(graphqlOperation(getTweetIgnore, {id}));
    console.log(result);
    if (result.data.getTweetIgnore) {
      const result = await API.graphql(graphqlOperation(deleteTweetIgnore,  {input: {id}}));
      console.log(result);
      this._tweetBlackList=this._tweetBlackList.filter(i=> i !== parsedURL.tweet);
    } else {
      this._notification.show("Not ignoring " + parsedURL.tweet);
    }
  }
}
