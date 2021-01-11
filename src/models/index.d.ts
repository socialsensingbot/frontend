import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";





export declare class UserPreferences {
  readonly id: string;
  readonly prefs?: string;
  constructor(init: ModelInit<UserPreferences>);
  static copyOf(source: UserPreferences, mutator: (draft: MutableModel<UserPreferences>) => MutableModel<UserPreferences> | void): UserPreferences;
}

export declare class UserSession {
  readonly id: string;
  readonly fingerprint?: string;
  readonly client?: string;
  readonly open: boolean;
  readonly group?: string;
  readonly user?: string;
  readonly ttl?: number;
  constructor(init: ModelInit<UserSession>);
  static copyOf(source: UserSession, mutator: (draft: MutableModel<UserSession>) => MutableModel<UserSession> | void): UserSession;
}

export declare class GroupPreferences {
  readonly id: string;
  readonly group: string;
  readonly prefs?: string;
  constructor(init: ModelInit<GroupPreferences>);
  static copyOf(source: GroupPreferences, mutator: (draft: MutableModel<GroupPreferences>) => MutableModel<GroupPreferences> | void): GroupPreferences;
}

export declare class GroupTweetIgnore {
  readonly id: string;
  readonly url: string;
  readonly ignoredBy: string;
  readonly tweetId: string;
  readonly ownerGroups?: (string | null)[];
  readonly scope: string;
  constructor(init: ModelInit<GroupTweetIgnore>);
  static copyOf(source: GroupTweetIgnore, mutator: (draft: MutableModel<GroupTweetIgnore>) => MutableModel<GroupTweetIgnore> | void): GroupTweetIgnore;
}

export declare class GroupTweetAnnotations {
  readonly id: string;
  readonly url: string;
  readonly annotatedBy: string;
  readonly tweetId: string;
  readonly ownerGroups?: (string | null)[];
  readonly annotations?: string;
  constructor(init: ModelInit<GroupTweetAnnotations>);
  static copyOf(source: GroupTweetAnnotations, mutator: (draft: MutableModel<GroupTweetAnnotations>) => MutableModel<GroupTweetAnnotations> | void): GroupTweetAnnotations;
}

export declare class GroupTwitterUserIgnore {
  readonly id: string;
  readonly twitterScreenName: string;
  readonly ignoredBy: string;
  readonly ownerGroups?: (string | null)[];
  readonly scope: string;
  constructor(init: ModelInit<GroupTwitterUserIgnore>);
  static copyOf(source: GroupTwitterUserIgnore, mutator: (draft: MutableModel<GroupTwitterUserIgnore>) => MutableModel<GroupTwitterUserIgnore> | void): GroupTwitterUserIgnore;
}