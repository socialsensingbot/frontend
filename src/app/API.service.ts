/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import {Injectable} from "@angular/core";
import API, {graphqlOperation} from "@aws-amplify/api";
import {GraphQLResult} from "@aws-amplify/api/lib/types";
import {Observable} from "zen-observable-ts";

export type CreateUserPreferencesInput = {
  id?: string | null;
};

export type ModelUserPreferencesConditionInput = {
  and?: Array<ModelUserPreferencesConditionInput | null> | null;
  or?: Array<ModelUserPreferencesConditionInput | null> | null;
  not?: ModelUserPreferencesConditionInput | null;
};

export type UpdateUserPreferencesInput = {
  id: string;
};

export type DeleteUserPreferencesInput = {
  id?: string | null;
};

export type CreateUserSessionInput = {
  id?: string | null;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
};

export type ModelUserSessionConditionInput = {
  fingerprint?: ModelStringInput | null;
  client?: ModelStringInput | null;
  open?: ModelBooleanInput | null;
  and?: Array<ModelUserSessionConditionInput | null> | null;
  or?: Array<ModelUserSessionConditionInput | null> | null;
  not?: ModelUserSessionConditionInput | null;
};

export type ModelStringInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null"
}

export type ModelSizeInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
};

export type ModelBooleanInput = {
  ne?: boolean | null;
  eq?: boolean | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type UpdateUserSessionInput = {
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open?: boolean | null;
};

export type DeleteUserSessionInput = {
  id?: string | null;
};

export type CreateGroupPreferencesInput = {
  id?: string | null;
  group: string;
  locale?: string | null;
  timezone?: string | null;
  multipleSessions?: boolean | null;
};

export type ModelGroupPreferencesConditionInput = {
  locale?: ModelStringInput | null;
  timezone?: ModelStringInput | null;
  multipleSessions?: ModelBooleanInput | null;
  and?: Array<ModelGroupPreferencesConditionInput | null> | null;
  or?: Array<ModelGroupPreferencesConditionInput | null> | null;
  not?: ModelGroupPreferencesConditionInput | null;
};

export type UpdateGroupPreferencesInput = {
  id: string;
  group?: string | null;
  locale?: string | null;
  timezone?: string | null;
  multipleSessions?: boolean | null;
};

export type DeleteGroupPreferencesInput = {
  id?: string | null;
};

export type CreateGroupTweetIgnoreInput = {
  id?: string | null;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
};

export type ModelGroupTweetIgnoreConditionInput = {
  url?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTweetIgnoreConditionInput | null> | null;
  or?: Array<ModelGroupTweetIgnoreConditionInput | null> | null;
  not?: ModelGroupTweetIgnoreConditionInput | null;
};

export type UpdateGroupTweetIgnoreInput = {
  id: string;
  url?: string | null;
  ignoredBy?: string | null;
  tweetId?: string | null;
  ownerGroups?: Array<string | null> | null;
  scope?: string | null;
};

export type DeleteGroupTweetIgnoreInput = {
  id?: string | null;
};

export type CreateGroupTwitterUserIgnoreInput = {
  id?: string | null;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
};

export type ModelGroupTwitterUserIgnoreConditionInput = {
  twitterScreenName?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTwitterUserIgnoreConditionInput | null> | null;
  or?: Array<ModelGroupTwitterUserIgnoreConditionInput | null> | null;
  not?: ModelGroupTwitterUserIgnoreConditionInput | null;
};

export type UpdateGroupTwitterUserIgnoreInput = {
  id: string;
  twitterScreenName?: string | null;
  ignoredBy?: string | null;
  ownerGroups?: Array<string | null> | null;
  scope?: string | null;
};

export type DeleteGroupTwitterUserIgnoreInput = {
  id?: string | null;
};

export type CreateTweetIgnoreInput = {
  id?: string | null;
  url: string;
  tweetId?: string | null;
  tweetIgnoreUserId?: string | null;
};

export type ModelTweetIgnoreConditionInput = {
  url?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  and?: Array<ModelTweetIgnoreConditionInput | null> | null;
  or?: Array<ModelTweetIgnoreConditionInput | null> | null;
  not?: ModelTweetIgnoreConditionInput | null;
};

export type UpdateTweetIgnoreInput = {
  id: string;
  url?: string | null;
  tweetId?: string | null;
  tweetIgnoreUserId?: string | null;
};

export type DeleteTweetIgnoreInput = {
  id?: string | null;
};

export type CreateTwitterUserIgnoreInput = {
  id?: string | null;
  twitterScreenName: string;
  twitterUserIgnoreUserId?: string | null;
};

export type ModelTwitterUserIgnoreConditionInput = {
  twitterScreenName?: ModelStringInput | null;
  and?: Array<ModelTwitterUserIgnoreConditionInput | null> | null;
  or?: Array<ModelTwitterUserIgnoreConditionInput | null> | null;
  not?: ModelTwitterUserIgnoreConditionInput | null;
};

export type UpdateTwitterUserIgnoreInput = {
  id: string;
  twitterScreenName?: string | null;
  twitterUserIgnoreUserId?: string | null;
};

export type DeleteTwitterUserIgnoreInput = {
  id?: string | null;
};

export type ModelUserPreferencesFilterInput = {
  id?: ModelIDInput | null;
  and?: Array<ModelUserPreferencesFilterInput | null> | null;
  or?: Array<ModelUserPreferencesFilterInput | null> | null;
  not?: ModelUserPreferencesFilterInput | null;
};

export type ModelIDInput = {
  ne?: string | null;
  eq?: string | null;
  le?: string | null;
  lt?: string | null;
  ge?: string | null;
  gt?: string | null;
  contains?: string | null;
  notContains?: string | null;
  between?: Array<string | null> | null;
  beginsWith?: string | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
  size?: ModelSizeInput | null;
};

export type ModelUserSessionFilterInput = {
  id?: ModelIDInput | null;
  fingerprint?: ModelStringInput | null;
  client?: ModelStringInput | null;
  open?: ModelBooleanInput | null;
  and?: Array<ModelUserSessionFilterInput | null> | null;
  or?: Array<ModelUserSessionFilterInput | null> | null;
  not?: ModelUserSessionFilterInput | null;
};

export type ModelGroupPreferencesFilterInput = {
  id?: ModelIDInput | null;
  group?: ModelStringInput | null;
  locale?: ModelStringInput | null;
  timezone?: ModelStringInput | null;
  multipleSessions?: ModelBooleanInput | null;
  and?: Array<ModelGroupPreferencesFilterInput | null> | null;
  or?: Array<ModelGroupPreferencesFilterInput | null> | null;
  not?: ModelGroupPreferencesFilterInput | null;
};

export type ModelGroupTweetIgnoreFilterInput = {
  id?: ModelIDInput | null;
  url?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTweetIgnoreFilterInput | null> | null;
  or?: Array<ModelGroupTweetIgnoreFilterInput | null> | null;
  not?: ModelGroupTweetIgnoreFilterInput | null;
};

export type ModelGroupTwitterUserIgnoreFilterInput = {
  id?: ModelIDInput | null;
  twitterScreenName?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTwitterUserIgnoreFilterInput | null> | null;
  or?: Array<ModelGroupTwitterUserIgnoreFilterInput | null> | null;
  not?: ModelGroupTwitterUserIgnoreFilterInput | null;
};

export type ModelTweetIgnoreFilterInput = {
  id?: ModelIDInput | null;
  url?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  and?: Array<ModelTweetIgnoreFilterInput | null> | null;
  or?: Array<ModelTweetIgnoreFilterInput | null> | null;
  not?: ModelTweetIgnoreFilterInput | null;
};

export type ModelTwitterUserIgnoreFilterInput = {
  id?: ModelIDInput | null;
  twitterScreenName?: ModelStringInput | null;
  and?: Array<ModelTwitterUserIgnoreFilterInput | null> | null;
  or?: Array<ModelTwitterUserIgnoreFilterInput | null> | null;
  not?: ModelTwitterUserIgnoreFilterInput | null;
};

export type CreateUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type UpdateUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type DeleteUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type CreateUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type UpdateUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type DeleteUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type CreateGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTweetIgnoreMutation = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type UpdateTweetIgnoreMutation = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type DeleteTweetIgnoreMutation = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type CreateTwitterUserIgnoreMutation = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type UpdateTwitterUserIgnoreMutation = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type DeleteTwitterUserIgnoreMutation = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type GetUserPreferencesQuery = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type ListUserPreferencessQuery = {
  __typename: "ModelUserPreferencesConnection";
  items: Array<{
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null> | null;
  nextToken: string | null;
};

export type GetUserSessionQuery = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type ListUserSessionsQuery = {
  __typename: "ModelUserSessionConnection";
  items: Array<{
    __typename: "UserSession";
    id: string;
    fingerprint: string | null;
    client: string | null;
    open: boolean;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null> | null;
  nextToken: string | null;
};

export type GetGroupPreferencesQuery = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupPreferencessQuery = {
  __typename: "ModelGroupPreferencesConnection";
  items: Array<{
    __typename: "GroupPreferences";
    id: string;
    group: string;
    locale: string | null;
    timezone: string | null;
    multipleSessions: boolean | null;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken: string | null;
};

export type GetGroupTweetIgnoreQuery = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupTweetIgnoresQuery = {
  __typename: "ModelGroupTweetIgnoreConnection";
  items: Array<{
    __typename: "GroupTweetIgnore";
    id: string;
    url: string;
    ignoredBy: string;
    tweetId: string;
    ownerGroups: Array<string | null> | null;
    scope: string;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken: string | null;
};

export type GetGroupTwitterUserIgnoreQuery = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupTwitterUserIgnoresQuery = {
  __typename: "ModelGroupTwitterUserIgnoreConnection";
  items: Array<{
    __typename: "GroupTwitterUserIgnore";
    id: string;
    twitterScreenName: string;
    ignoredBy: string;
    ownerGroups: Array<string | null> | null;
    scope: string;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken: string | null;
};

export type GetTweetIgnoreQuery = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type ListTweetIgnoresQuery = {
  __typename: "ModelTweetIgnoreConnection";
  items: Array<{
    __typename: "TweetIgnore";
    id: string;
    url: string;
    tweetId: string | null;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null> | null;
  nextToken: string | null;
};

export type GetTwitterUserIgnoreQuery = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type ListTwitterUserIgnoresQuery = {
  __typename: "ModelTwitterUserIgnoreConnection";
  items: Array<{
    __typename: "TwitterUserIgnore";
    id: string;
    twitterScreenName: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null> | null;
  nextToken: string | null;
};

export type OnCreateUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnUpdateUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnDeleteUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  ignoreTweets: {
    __typename: "ModelTweetIgnoreConnection";
    nextToken: string | null;
  } | null;
  ignorePeople: {
    __typename: "ModelTwitterUserIgnoreConnection";
    nextToken: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnCreateUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnUpdateUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnDeleteUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint: string | null;
  client: string | null;
  open: boolean;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnCreateGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  locale: string | null;
  timezone: string | null;
  multipleSessions: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups: Array<string | null> | null;
  scope: string;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateTweetIgnoreSubscription = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnUpdateTweetIgnoreSubscription = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnDeleteTweetIgnoreSubscription = {
  __typename: "TweetIgnore";
  id: string;
  url: string;
  tweetId: string | null;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnCreateTwitterUserIgnoreSubscription = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnUpdateTwitterUserIgnoreSubscription = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

export type OnDeleteTwitterUserIgnoreSubscription = {
  __typename: "TwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  user: {
    __typename: "UserPreferences";
    id: string;
    createdAt: string;
    updatedAt: string;
    owner: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
};

@Injectable({
              providedIn: "root"
            })
export class APIService {
  async CreateUserPreferences(
    input: CreateUserPreferencesInput,
    condition?: ModelUserPreferencesConditionInput
  ): Promise<CreateUserPreferencesMutation> {
    const statement = `mutation CreateUserPreferences($input: CreateUserPreferencesInput!, $condition: ModelUserPreferencesConditionInput) {
        createUserPreferences(input: $input, condition: $condition) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateUserPreferencesMutation>response.data.createUserPreferences;
  }
  async UpdateUserPreferences(
    input: UpdateUserPreferencesInput,
    condition?: ModelUserPreferencesConditionInput
  ): Promise<UpdateUserPreferencesMutation> {
    const statement = `mutation UpdateUserPreferences($input: UpdateUserPreferencesInput!, $condition: ModelUserPreferencesConditionInput) {
        updateUserPreferences(input: $input, condition: $condition) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateUserPreferencesMutation>response.data.updateUserPreferences;
  }
  async DeleteUserPreferences(
    input: DeleteUserPreferencesInput,
    condition?: ModelUserPreferencesConditionInput
  ): Promise<DeleteUserPreferencesMutation> {
    const statement = `mutation DeleteUserPreferences($input: DeleteUserPreferencesInput!, $condition: ModelUserPreferencesConditionInput) {
        deleteUserPreferences(input: $input, condition: $condition) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteUserPreferencesMutation>response.data.deleteUserPreferences;
  }
  async CreateUserSession(
    input: CreateUserSessionInput,
    condition?: ModelUserSessionConditionInput
  ): Promise<CreateUserSessionMutation> {
    const statement = `mutation CreateUserSession($input: CreateUserSessionInput!, $condition: ModelUserSessionConditionInput) {
        createUserSession(input: $input, condition: $condition) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateUserSessionMutation>response.data.createUserSession;
  }
  async UpdateUserSession(
    input: UpdateUserSessionInput,
    condition?: ModelUserSessionConditionInput
  ): Promise<UpdateUserSessionMutation> {
    const statement = `mutation UpdateUserSession($input: UpdateUserSessionInput!, $condition: ModelUserSessionConditionInput) {
        updateUserSession(input: $input, condition: $condition) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateUserSessionMutation>response.data.updateUserSession;
  }
  async DeleteUserSession(
    input: DeleteUserSessionInput,
    condition?: ModelUserSessionConditionInput
  ): Promise<DeleteUserSessionMutation> {
    const statement = `mutation DeleteUserSession($input: DeleteUserSessionInput!, $condition: ModelUserSessionConditionInput) {
        deleteUserSession(input: $input, condition: $condition) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteUserSessionMutation>response.data.deleteUserSession;
  }
  async CreateGroupPreferences(
    input: CreateGroupPreferencesInput,
    condition?: ModelGroupPreferencesConditionInput
  ): Promise<CreateGroupPreferencesMutation> {
    const statement = `mutation CreateGroupPreferences($input: CreateGroupPreferencesInput!, $condition: ModelGroupPreferencesConditionInput) {
        createGroupPreferences(input: $input, condition: $condition) {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateGroupPreferencesMutation>response.data.createGroupPreferences;
  }
  async UpdateGroupPreferences(
    input: UpdateGroupPreferencesInput,
    condition?: ModelGroupPreferencesConditionInput
  ): Promise<UpdateGroupPreferencesMutation> {
    const statement = `mutation UpdateGroupPreferences($input: UpdateGroupPreferencesInput!, $condition: ModelGroupPreferencesConditionInput) {
        updateGroupPreferences(input: $input, condition: $condition) {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateGroupPreferencesMutation>response.data.updateGroupPreferences;
  }
  async DeleteGroupPreferences(
    input: DeleteGroupPreferencesInput,
    condition?: ModelGroupPreferencesConditionInput
  ): Promise<DeleteGroupPreferencesMutation> {
    const statement = `mutation DeleteGroupPreferences($input: DeleteGroupPreferencesInput!, $condition: ModelGroupPreferencesConditionInput) {
        deleteGroupPreferences(input: $input, condition: $condition) {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteGroupPreferencesMutation>response.data.deleteGroupPreferences;
  }
  async CreateGroupTweetIgnore(
    input: CreateGroupTweetIgnoreInput,
    condition?: ModelGroupTweetIgnoreConditionInput
  ): Promise<CreateGroupTweetIgnoreMutation> {
    const statement = `mutation CreateGroupTweetIgnore($input: CreateGroupTweetIgnoreInput!, $condition: ModelGroupTweetIgnoreConditionInput) {
        createGroupTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateGroupTweetIgnoreMutation>response.data.createGroupTweetIgnore;
  }
  async UpdateGroupTweetIgnore(
    input: UpdateGroupTweetIgnoreInput,
    condition?: ModelGroupTweetIgnoreConditionInput
  ): Promise<UpdateGroupTweetIgnoreMutation> {
    const statement = `mutation UpdateGroupTweetIgnore($input: UpdateGroupTweetIgnoreInput!, $condition: ModelGroupTweetIgnoreConditionInput) {
        updateGroupTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateGroupTweetIgnoreMutation>response.data.updateGroupTweetIgnore;
  }
  async DeleteGroupTweetIgnore(
    input: DeleteGroupTweetIgnoreInput,
    condition?: ModelGroupTweetIgnoreConditionInput
  ): Promise<DeleteGroupTweetIgnoreMutation> {
    const statement = `mutation DeleteGroupTweetIgnore($input: DeleteGroupTweetIgnoreInput!, $condition: ModelGroupTweetIgnoreConditionInput) {
        deleteGroupTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteGroupTweetIgnoreMutation>response.data.deleteGroupTweetIgnore;
  }
  async CreateGroupTwitterUserIgnore(
    input: CreateGroupTwitterUserIgnoreInput,
    condition?: ModelGroupTwitterUserIgnoreConditionInput
  ): Promise<CreateGroupTwitterUserIgnoreMutation> {
    const statement = `mutation CreateGroupTwitterUserIgnore($input: CreateGroupTwitterUserIgnoreInput!, $condition: ModelGroupTwitterUserIgnoreConditionInput) {
        createGroupTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateGroupTwitterUserIgnoreMutation>(
      response.data.createGroupTwitterUserIgnore
    );
  }
  async UpdateGroupTwitterUserIgnore(
    input: UpdateGroupTwitterUserIgnoreInput,
    condition?: ModelGroupTwitterUserIgnoreConditionInput
  ): Promise<UpdateGroupTwitterUserIgnoreMutation> {
    const statement = `mutation UpdateGroupTwitterUserIgnore($input: UpdateGroupTwitterUserIgnoreInput!, $condition: ModelGroupTwitterUserIgnoreConditionInput) {
        updateGroupTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateGroupTwitterUserIgnoreMutation>(
      response.data.updateGroupTwitterUserIgnore
    );
  }
  async DeleteGroupTwitterUserIgnore(
    input: DeleteGroupTwitterUserIgnoreInput,
    condition?: ModelGroupTwitterUserIgnoreConditionInput
  ): Promise<DeleteGroupTwitterUserIgnoreMutation> {
    const statement = `mutation DeleteGroupTwitterUserIgnore($input: DeleteGroupTwitterUserIgnoreInput!, $condition: ModelGroupTwitterUserIgnoreConditionInput) {
        deleteGroupTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteGroupTwitterUserIgnoreMutation>(
      response.data.deleteGroupTwitterUserIgnore
    );
  }
  async CreateTweetIgnore(
    input: CreateTweetIgnoreInput,
    condition?: ModelTweetIgnoreConditionInput
  ): Promise<CreateTweetIgnoreMutation> {
    const statement = `mutation CreateTweetIgnore($input: CreateTweetIgnoreInput!, $condition: ModelTweetIgnoreConditionInput) {
        createTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateTweetIgnoreMutation>response.data.createTweetIgnore;
  }
  async UpdateTweetIgnore(
    input: UpdateTweetIgnoreInput,
    condition?: ModelTweetIgnoreConditionInput
  ): Promise<UpdateTweetIgnoreMutation> {
    const statement = `mutation UpdateTweetIgnore($input: UpdateTweetIgnoreInput!, $condition: ModelTweetIgnoreConditionInput) {
        updateTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateTweetIgnoreMutation>response.data.updateTweetIgnore;
  }
  async DeleteTweetIgnore(
    input: DeleteTweetIgnoreInput,
    condition?: ModelTweetIgnoreConditionInput
  ): Promise<DeleteTweetIgnoreMutation> {
    const statement = `mutation DeleteTweetIgnore($input: DeleteTweetIgnoreInput!, $condition: ModelTweetIgnoreConditionInput) {
        deleteTweetIgnore(input: $input, condition: $condition) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteTweetIgnoreMutation>response.data.deleteTweetIgnore;
  }
  async CreateTwitterUserIgnore(
    input: CreateTwitterUserIgnoreInput,
    condition?: ModelTwitterUserIgnoreConditionInput
  ): Promise<CreateTwitterUserIgnoreMutation> {
    const statement = `mutation CreateTwitterUserIgnore($input: CreateTwitterUserIgnoreInput!, $condition: ModelTwitterUserIgnoreConditionInput) {
        createTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateTwitterUserIgnoreMutation>(
      response.data.createTwitterUserIgnore
    );
  }
  async UpdateTwitterUserIgnore(
    input: UpdateTwitterUserIgnoreInput,
    condition?: ModelTwitterUserIgnoreConditionInput
  ): Promise<UpdateTwitterUserIgnoreMutation> {
    const statement = `mutation UpdateTwitterUserIgnore($input: UpdateTwitterUserIgnoreInput!, $condition: ModelTwitterUserIgnoreConditionInput) {
        updateTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateTwitterUserIgnoreMutation>(
      response.data.updateTwitterUserIgnore
    );
  }
  async DeleteTwitterUserIgnore(
    input: DeleteTwitterUserIgnoreInput,
    condition?: ModelTwitterUserIgnoreConditionInput
  ): Promise<DeleteTwitterUserIgnoreMutation> {
    const statement = `mutation DeleteTwitterUserIgnore($input: DeleteTwitterUserIgnoreInput!, $condition: ModelTwitterUserIgnoreConditionInput) {
        deleteTwitterUserIgnore(input: $input, condition: $condition) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    if (condition) {
      gqlAPIServiceArguments.condition = condition;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteTwitterUserIgnoreMutation>(
      response.data.deleteTwitterUserIgnore
    );
  }
  async GetUserPreferences(id: string): Promise<GetUserPreferencesQuery> {
    const statement = `query GetUserPreferences($id: ID!) {
        getUserPreferences(id: $id) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetUserPreferencesQuery>response.data.getUserPreferences;
  }
  async ListUserPreferencess(
    filter?: ModelUserPreferencesFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListUserPreferencessQuery> {
    const statement = `query ListUserPreferencess($filter: ModelUserPreferencesFilterInput, $limit: Int, $nextToken: String) {
        listUserPreferencess(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListUserPreferencessQuery>response.data.listUserPreferencess;
  }
  async GetUserSession(id: string): Promise<GetUserSessionQuery> {
    const statement = `query GetUserSession($id: ID!) {
        getUserSession(id: $id) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetUserSessionQuery>response.data.getUserSession;
  }
  async ListUserSessions(
    filter?: ModelUserSessionFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListUserSessionsQuery> {
    const statement = `query ListUserSessions($filter: ModelUserSessionFilterInput, $limit: Int, $nextToken: String) {
        listUserSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            fingerprint
            client
            open
            createdAt
            updatedAt
            owner
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListUserSessionsQuery>response.data.listUserSessions;
  }
  async GetGroupPreferences(id: string): Promise<GetGroupPreferencesQuery> {
    const statement = `query GetGroupPreferences($id: ID!) {
        getGroupPreferences(id: $id) {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetGroupPreferencesQuery>response.data.getGroupPreferences;
  }
  async ListGroupPreferencess(
    filter?: ModelGroupPreferencesFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListGroupPreferencessQuery> {
    const statement = `query ListGroupPreferencess($filter: ModelGroupPreferencesFilterInput, $limit: Int, $nextToken: String) {
        listGroupPreferencess(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            group
            locale
            timezone
            multipleSessions
            createdAt
            updatedAt
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListGroupPreferencessQuery>response.data.listGroupPreferencess;
  }
  async GetGroupTweetIgnore(id: string): Promise<GetGroupTweetIgnoreQuery> {
    const statement = `query GetGroupTweetIgnore($id: ID!) {
        getGroupTweetIgnore(id: $id) {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetGroupTweetIgnoreQuery>response.data.getGroupTweetIgnore;
  }
  async ListGroupTweetIgnores(
    filter?: ModelGroupTweetIgnoreFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListGroupTweetIgnoresQuery> {
    const statement = `query ListGroupTweetIgnores($filter: ModelGroupTweetIgnoreFilterInput, $limit: Int, $nextToken: String) {
        listGroupTweetIgnores(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            url
            ignoredBy
            tweetId
            ownerGroups
            scope
            createdAt
            updatedAt
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListGroupTweetIgnoresQuery>response.data.listGroupTweetIgnores;
  }
  async GetGroupTwitterUserIgnore(
    id: string
  ): Promise<GetGroupTwitterUserIgnoreQuery> {
    const statement = `query GetGroupTwitterUserIgnore($id: ID!) {
        getGroupTwitterUserIgnore(id: $id) {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetGroupTwitterUserIgnoreQuery>(
      response.data.getGroupTwitterUserIgnore
    );
  }
  async ListGroupTwitterUserIgnores(
    filter?: ModelGroupTwitterUserIgnoreFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListGroupTwitterUserIgnoresQuery> {
    const statement = `query ListGroupTwitterUserIgnores($filter: ModelGroupTwitterUserIgnoreFilterInput, $limit: Int, $nextToken: String) {
        listGroupTwitterUserIgnores(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            twitterScreenName
            ignoredBy
            ownerGroups
            scope
            createdAt
            updatedAt
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListGroupTwitterUserIgnoresQuery>(
      response.data.listGroupTwitterUserIgnores
    );
  }
  async GetTweetIgnore(id: string): Promise<GetTweetIgnoreQuery> {
    const statement = `query GetTweetIgnore($id: ID!) {
        getTweetIgnore(id: $id) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetTweetIgnoreQuery>response.data.getTweetIgnore;
  }
  async ListTweetIgnores(
    filter?: ModelTweetIgnoreFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListTweetIgnoresQuery> {
    const statement = `query ListTweetIgnores($filter: ModelTweetIgnoreFilterInput, $limit: Int, $nextToken: String) {
        listTweetIgnores(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            url
            tweetId
            createdAt
            updatedAt
            owner
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListTweetIgnoresQuery>response.data.listTweetIgnores;
  }
  async GetTwitterUserIgnore(id: string): Promise<GetTwitterUserIgnoreQuery> {
    const statement = `query GetTwitterUserIgnore($id: ID!) {
        getTwitterUserIgnore(id: $id) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`;
    const gqlAPIServiceArguments: any = {
      id
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetTwitterUserIgnoreQuery>response.data.getTwitterUserIgnore;
  }
  async ListTwitterUserIgnores(
    filter?: ModelTwitterUserIgnoreFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListTwitterUserIgnoresQuery> {
    const statement = `query ListTwitterUserIgnores($filter: ModelTwitterUserIgnoreFilterInput, $limit: Int, $nextToken: String) {
        listTwitterUserIgnores(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            twitterScreenName
            createdAt
            updatedAt
            owner
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListTwitterUserIgnoresQuery>response.data.listTwitterUserIgnores;
  }

  OnCreateUserPreferencesListener: Observable<OnCreateUserPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateUserPreferences($owner: String!) {
        onCreateUserPreferences(owner: $owner) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnCreateUserPreferencesSubscription>;

  OnUpdateUserPreferencesListener: Observable<OnUpdateUserPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateUserPreferences($owner: String!) {
        onUpdateUserPreferences(owner: $owner) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnUpdateUserPreferencesSubscription>;

  OnDeleteUserPreferencesListener: Observable<OnDeleteUserPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteUserPreferences($owner: String!) {
        onDeleteUserPreferences(owner: $owner) {
          __typename
          id
          ignoreTweets {
            __typename
            nextToken
          }
          ignorePeople {
            __typename
            nextToken
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnDeleteUserPreferencesSubscription>;

  OnCreateUserSessionListener: Observable<OnCreateUserSessionSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateUserSession($owner: String!) {
        onCreateUserSession(owner: $owner) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnCreateUserSessionSubscription>;

  OnUpdateUserSessionListener: Observable<OnUpdateUserSessionSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateUserSession($owner: String!) {
        onUpdateUserSession(owner: $owner) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnUpdateUserSessionSubscription>;

  OnDeleteUserSessionListener: Observable<OnDeleteUserSessionSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteUserSession($owner: String!) {
        onDeleteUserSession(owner: $owner) {
          __typename
          id
          fingerprint
          client
          open
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnDeleteUserSessionSubscription>;

  OnCreateGroupPreferencesListener: Observable<OnCreateGroupPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupPreferences {
        onCreateGroupPreferences {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnCreateGroupPreferencesSubscription>;

  OnUpdateGroupPreferencesListener: Observable<OnUpdateGroupPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupPreferences {
        onUpdateGroupPreferences {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnUpdateGroupPreferencesSubscription>;

  OnDeleteGroupPreferencesListener: Observable<OnDeleteGroupPreferencesSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupPreferences {
        onDeleteGroupPreferences {
          __typename
          id
          group
          locale
          timezone
          multipleSessions
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnDeleteGroupPreferencesSubscription>;

  OnCreateGroupTweetIgnoreListener: Observable<OnCreateGroupTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupTweetIgnore {
        onCreateGroupTweetIgnore {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnCreateGroupTweetIgnoreSubscription>;

  OnUpdateGroupTweetIgnoreListener: Observable<OnUpdateGroupTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupTweetIgnore {
        onUpdateGroupTweetIgnore {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnUpdateGroupTweetIgnoreSubscription>;

  OnDeleteGroupTweetIgnoreListener: Observable<OnDeleteGroupTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupTweetIgnore {
        onDeleteGroupTweetIgnore {
          __typename
          id
          url
          ignoredBy
          tweetId
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnDeleteGroupTweetIgnoreSubscription>;

  OnCreateGroupTwitterUserIgnoreListener: Observable<OnCreateGroupTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupTwitterUserIgnore {
        onCreateGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnCreateGroupTwitterUserIgnoreSubscription>;

  OnUpdateGroupTwitterUserIgnoreListener: Observable<OnUpdateGroupTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupTwitterUserIgnore {
        onUpdateGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnUpdateGroupTwitterUserIgnoreSubscription>;

  OnDeleteGroupTwitterUserIgnoreListener: Observable<OnDeleteGroupTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupTwitterUserIgnore {
        onDeleteGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<OnDeleteGroupTwitterUserIgnoreSubscription>;

  OnCreateTweetIgnoreListener: Observable<OnCreateTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateTweetIgnore($owner: String!) {
        onCreateTweetIgnore(owner: $owner) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnCreateTweetIgnoreSubscription>;

  OnUpdateTweetIgnoreListener: Observable<OnUpdateTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateTweetIgnore($owner: String!) {
        onUpdateTweetIgnore(owner: $owner) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnUpdateTweetIgnoreSubscription>;

  OnDeleteTweetIgnoreListener: Observable<OnDeleteTweetIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteTweetIgnore($owner: String!) {
        onDeleteTweetIgnore(owner: $owner) {
          __typename
          id
          url
          tweetId
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnDeleteTweetIgnoreSubscription>;

  OnCreateTwitterUserIgnoreListener: Observable<OnCreateTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnCreateTwitterUserIgnore($owner: String!) {
        onCreateTwitterUserIgnore(owner: $owner) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnCreateTwitterUserIgnoreSubscription>;

  OnUpdateTwitterUserIgnoreListener: Observable<OnUpdateTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnUpdateTwitterUserIgnore($owner: String!) {
        onUpdateTwitterUserIgnore(owner: $owner) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnUpdateTwitterUserIgnoreSubscription>;

  OnDeleteTwitterUserIgnoreListener: Observable<OnDeleteTwitterUserIgnoreSubscription> = API.graphql(
    graphqlOperation(
      `subscription OnDeleteTwitterUserIgnore($owner: String!) {
        onDeleteTwitterUserIgnore(owner: $owner) {
          __typename
          id
          twitterScreenName
          user {
            __typename
            id
            createdAt
            updatedAt
            owner
          }
          createdAt
          updatedAt
          owner
        }
      }`
    )
  ) as Observable<OnDeleteTwitterUserIgnoreSubscription>;
}
