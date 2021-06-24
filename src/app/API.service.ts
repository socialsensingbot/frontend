/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation, GraphQLResult } from "@aws-amplify/api-graphql";
import { Observable } from "zen-observable-ts";

export interface SubscriptionResponse<T> {
  value: GraphQLResult<T>;
}

export type CreateUserPreferencesInput = {
  id?: string | null;
  owner?: string | null;
  prefs?: string | null;
  _version?: number | null;
};

export type ModelUserPreferencesConditionInput = {
  prefs?: ModelStringInput | null;
  and?: Array<ModelUserPreferencesConditionInput | null> | null;
  or?: Array<ModelUserPreferencesConditionInput | null> | null;
  not?: ModelUserPreferencesConditionInput | null;
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

export type UserPreferences = {
  __typename: "UserPreferences";
  id?: string;
  owner?: string | null;
  prefs?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateUserPreferencesInput = {
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version?: number | null;
};

export type DeleteUserPreferencesInput = {
  id: string;
  _version?: number | null;
};

export type CreateUserDashboardInput = {
  id?: string | null;
  owner?: string | null;
  dashboard?: string | null;
  _version?: number | null;
};

export type ModelUserDashboardConditionInput = {
  dashboard?: ModelStringInput | null;
  and?: Array<ModelUserDashboardConditionInput | null> | null;
  or?: Array<ModelUserDashboardConditionInput | null> | null;
  not?: ModelUserDashboardConditionInput | null;
};

export type UserDashboard = {
  __typename: "UserDashboard";
  id?: string;
  owner?: string | null;
  dashboard?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateUserDashboardInput = {
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version?: number | null;
};

export type DeleteUserDashboardInput = {
  id: string;
  _version?: number | null;
};

export type CreateGroupDashboardInput = {
  id?: string | null;
  group: string;
  dashboard?: string | null;
  _version?: number | null;
};

export type ModelGroupDashboardConditionInput = {
  group?: ModelStringInput | null;
  dashboard?: ModelStringInput | null;
  and?: Array<ModelGroupDashboardConditionInput | null> | null;
  or?: Array<ModelGroupDashboardConditionInput | null> | null;
  not?: ModelGroupDashboardConditionInput | null;
};

export type GroupDashboard = {
  __typename: "GroupDashboard";
  id?: string;
  group?: string;
  dashboard?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateGroupDashboardInput = {
  id: string;
  group?: string | null;
  dashboard?: string | null;
  _version?: number | null;
};

export type DeleteGroupDashboardInput = {
  id: string;
  _version?: number | null;
};

export type CreateUserSessionInput = {
  id?: string | null;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version?: number | null;
};

export type ModelUserSessionConditionInput = {
  fingerprint?: ModelStringInput | null;
  client?: ModelStringInput | null;
  open?: ModelBooleanInput | null;
  group?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  ttl?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  sessionId?: ModelStringInput | null;
  and?: Array<ModelUserSessionConditionInput | null> | null;
  or?: Array<ModelUserSessionConditionInput | null> | null;
  not?: ModelUserSessionConditionInput | null;
};

export type ModelBooleanInput = {
  ne?: boolean | null;
  eq?: boolean | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type ModelIntInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  between?: Array<number | null> | null;
  attributeExists?: boolean | null;
  attributeType?: ModelAttributeTypes | null;
};

export type UserSession = {
  __typename: "UserSession";
  id?: string;
  fingerprint?: string | null;
  client?: string | null;
  open?: boolean;
  group?: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  updatedAt?: string;
};

export type UpdateUserSessionInput = {
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open?: boolean | null;
  group?: string | null;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version?: number | null;
};

export type DeleteUserSessionInput = {
  id: string;
  _version?: number | null;
};

export type CreateGroupPreferencesInput = {
  id?: string | null;
  group: string;
  prefs?: string | null;
  _version?: number | null;
};

export type ModelGroupPreferencesConditionInput = {
  group?: ModelStringInput | null;
  prefs?: ModelStringInput | null;
  and?: Array<ModelGroupPreferencesConditionInput | null> | null;
  or?: Array<ModelGroupPreferencesConditionInput | null> | null;
  not?: ModelGroupPreferencesConditionInput | null;
};

export type GroupPreferences = {
  __typename: "GroupPreferences";
  id?: string;
  group?: string;
  prefs?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateGroupPreferencesInput = {
  id: string;
  group?: string | null;
  prefs?: string | null;
  _version?: number | null;
};

export type DeleteGroupPreferencesInput = {
  id: string;
  _version?: number | null;
};

export type CreateGroupTweetIgnoreInput = {
  id?: string | null;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version?: number | null;
};

export type ModelGroupTweetIgnoreConditionInput = {
  url?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTweetIgnoreConditionInput | null> | null;
  or?: Array<ModelGroupTweetIgnoreConditionInput | null> | null;
  not?: ModelGroupTweetIgnoreConditionInput | null;
};

export type GroupTweetIgnore = {
  __typename: "GroupTweetIgnore";
  id?: string;
  url?: string;
  ignoredBy?: string;
  tweetId?: string;
  ownerGroups?: Array<string | null> | null;
  scope?: string;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateGroupTweetIgnoreInput = {
  id: string;
  url?: string | null;
  ignoredBy?: string | null;
  tweetId?: string | null;
  ownerGroups?: Array<string | null> | null;
  scope?: string | null;
  _version?: number | null;
};

export type DeleteGroupTweetIgnoreInput = {
  id: string;
  _version?: number | null;
};

export type CreateGroupTweetAnnotationsInput = {
  id?: string | null;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version?: number | null;
};

export type ModelGroupTweetAnnotationsConditionInput = {
  url?: ModelStringInput | null;
  annotatedBy?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  annotations?: ModelStringInput | null;
  and?: Array<ModelGroupTweetAnnotationsConditionInput | null> | null;
  or?: Array<ModelGroupTweetAnnotationsConditionInput | null> | null;
  not?: ModelGroupTweetAnnotationsConditionInput | null;
};

export type GroupTweetAnnotations = {
  __typename: "GroupTweetAnnotations";
  id?: string;
  url?: string;
  annotatedBy?: string;
  tweetId?: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateGroupTweetAnnotationsInput = {
  id: string;
  url?: string | null;
  annotatedBy?: string | null;
  tweetId?: string | null;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version?: number | null;
};

export type DeleteGroupTweetAnnotationsInput = {
  id: string;
  _version?: number | null;
};

export type CreateGroupTwitterUserIgnoreInput = {
  id?: string | null;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version?: number | null;
};

export type ModelGroupTwitterUserIgnoreConditionInput = {
  twitterScreenName?: ModelStringInput | null;
  ignoredBy?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  scope?: ModelStringInput | null;
  and?: Array<ModelGroupTwitterUserIgnoreConditionInput | null> | null;
  or?: Array<ModelGroupTwitterUserIgnoreConditionInput | null> | null;
  not?: ModelGroupTwitterUserIgnoreConditionInput | null;
};

export type GroupTwitterUserIgnore = {
  __typename: "GroupTwitterUserIgnore";
  id?: string;
  twitterScreenName?: string;
  ignoredBy?: string;
  ownerGroups?: Array<string | null> | null;
  scope?: string;
  _version?: number;
  _deleted?: boolean | null;
  _lastChangedAt?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateGroupTwitterUserIgnoreInput = {
  id: string;
  twitterScreenName?: string | null;
  ignoredBy?: string | null;
  ownerGroups?: Array<string | null> | null;
  scope?: string | null;
  _version?: number | null;
};

export type DeleteGroupTwitterUserIgnoreInput = {
  id: string;
  _version?: number | null;
};

export type ModelUserPreferencesFilterInput = {
  id?: ModelIDInput | null;
  owner?: ModelStringInput | null;
  prefs?: ModelStringInput | null;
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

export type ModelUserPreferencesConnection = {
  __typename: "ModelUserPreferencesConnection";
  items?: Array<UserPreferences | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type ModelUserDashboardFilterInput = {
  id?: ModelIDInput | null;
  owner?: ModelStringInput | null;
  dashboard?: ModelStringInput | null;
  and?: Array<ModelUserDashboardFilterInput | null> | null;
  or?: Array<ModelUserDashboardFilterInput | null> | null;
  not?: ModelUserDashboardFilterInput | null;
};

export type ModelUserDashboardConnection = {
  __typename: "ModelUserDashboardConnection";
  items?: Array<UserDashboard | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type ModelGroupDashboardFilterInput = {
  id?: ModelIDInput | null;
  group?: ModelStringInput | null;
  dashboard?: ModelStringInput | null;
  and?: Array<ModelGroupDashboardFilterInput | null> | null;
  or?: Array<ModelGroupDashboardFilterInput | null> | null;
  not?: ModelGroupDashboardFilterInput | null;
};

export type ModelGroupDashboardConnection = {
  __typename: "ModelGroupDashboardConnection";
  items?: Array<GroupDashboard | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type ModelUserSessionFilterInput = {
  id?: ModelIDInput | null;
  fingerprint?: ModelStringInput | null;
  client?: ModelStringInput | null;
  open?: ModelBooleanInput | null;
  group?: ModelStringInput | null;
  owner?: ModelStringInput | null;
  ttl?: ModelIntInput | null;
  createdAt?: ModelStringInput | null;
  sessionId?: ModelStringInput | null;
  and?: Array<ModelUserSessionFilterInput | null> | null;
  or?: Array<ModelUserSessionFilterInput | null> | null;
  not?: ModelUserSessionFilterInput | null;
};

export type ModelUserSessionConnection = {
  __typename: "ModelUserSessionConnection";
  items?: Array<UserSession | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type ModelGroupPreferencesFilterInput = {
  id?: ModelIDInput | null;
  group?: ModelStringInput | null;
  prefs?: ModelStringInput | null;
  and?: Array<ModelGroupPreferencesFilterInput | null> | null;
  or?: Array<ModelGroupPreferencesFilterInput | null> | null;
  not?: ModelGroupPreferencesFilterInput | null;
};

export type ModelGroupPreferencesConnection = {
  __typename: "ModelGroupPreferencesConnection";
  items?: Array<GroupPreferences | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
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

export type ModelGroupTweetIgnoreConnection = {
  __typename: "ModelGroupTweetIgnoreConnection";
  items?: Array<GroupTweetIgnore | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type ModelGroupTweetAnnotationsFilterInput = {
  id?: ModelIDInput | null;
  url?: ModelStringInput | null;
  annotatedBy?: ModelStringInput | null;
  tweetId?: ModelStringInput | null;
  ownerGroups?: ModelStringInput | null;
  annotations?: ModelStringInput | null;
  and?: Array<ModelGroupTweetAnnotationsFilterInput | null> | null;
  or?: Array<ModelGroupTweetAnnotationsFilterInput | null> | null;
  not?: ModelGroupTweetAnnotationsFilterInput | null;
};

export type ModelGroupTweetAnnotationsConnection = {
  __typename: "ModelGroupTweetAnnotationsConnection";
  items?: Array<GroupTweetAnnotations | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
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

export type ModelGroupTwitterUserIgnoreConnection = {
  __typename: "ModelGroupTwitterUserIgnoreConnection";
  items?: Array<GroupTwitterUserIgnore | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type CreateUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteUserPreferencesMutation = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserDashboardMutation = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserDashboardMutation = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteUserDashboardMutation = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupDashboardMutation = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupDashboardMutation = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupDashboardMutation = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type UpdateUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type DeleteUserSessionMutation = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type CreateGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupPreferencesMutation = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupTweetIgnoreMutation = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTweetAnnotationsMutation = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupTweetAnnotationsMutation = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupTweetAnnotationsMutation = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type DeleteGroupTwitterUserIgnoreMutation = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type GetUserPreferencesQuery = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListUserPreferencessQuery = {
  __typename: "ModelUserPreferencesConnection";
  items?: Array<{
    __typename: "UserPreferences";
    id: string;
    owner?: string | null;
    prefs?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncUserPreferencesQuery = {
  __typename: "ModelUserPreferencesConnection";
  items?: Array<{
    __typename: "UserPreferences";
    id: string;
    owner?: string | null;
    prefs?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetUserDashboardQuery = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListUserDashboardsQuery = {
  __typename: "ModelUserDashboardConnection";
  items?: Array<{
    __typename: "UserDashboard";
    id: string;
    owner?: string | null;
    dashboard?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncUserDashboardsQuery = {
  __typename: "ModelUserDashboardConnection";
  items?: Array<{
    __typename: "UserDashboard";
    id: string;
    owner?: string | null;
    dashboard?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetGroupDashboardQuery = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupDashboardsQuery = {
  __typename: "ModelGroupDashboardConnection";
  items?: Array<{
    __typename: "GroupDashboard";
    id: string;
    group: string;
    dashboard?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncGroupDashboardsQuery = {
  __typename: "ModelGroupDashboardConnection";
  items?: Array<{
    __typename: "GroupDashboard";
    id: string;
    group: string;
    dashboard?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetUserSessionQuery = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type ListUserSessionsQuery = {
  __typename: "ModelUserSessionConnection";
  items?: Array<{
    __typename: "UserSession";
    id: string;
    fingerprint?: string | null;
    client?: string | null;
    open: boolean;
    group: string;
    owner?: string | null;
    ttl?: number | null;
    createdAt?: string | null;
    sessionId?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncUserSessionsQuery = {
  __typename: "ModelUserSessionConnection";
  items?: Array<{
    __typename: "UserSession";
    id: string;
    fingerprint?: string | null;
    client?: string | null;
    open: boolean;
    group: string;
    owner?: string | null;
    ttl?: number | null;
    createdAt?: string | null;
    sessionId?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetGroupPreferencesQuery = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupPreferencessQuery = {
  __typename: "ModelGroupPreferencesConnection";
  items?: Array<{
    __typename: "GroupPreferences";
    id: string;
    group: string;
    prefs?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncGroupPreferencesQuery = {
  __typename: "ModelGroupPreferencesConnection";
  items?: Array<{
    __typename: "GroupPreferences";
    id: string;
    group: string;
    prefs?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetGroupTweetIgnoreQuery = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupTweetIgnoresQuery = {
  __typename: "ModelGroupTweetIgnoreConnection";
  items?: Array<{
    __typename: "GroupTweetIgnore";
    id: string;
    url: string;
    ignoredBy: string;
    tweetId: string;
    ownerGroups?: Array<string | null> | null;
    scope: string;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncGroupTweetIgnoresQuery = {
  __typename: "ModelGroupTweetIgnoreConnection";
  items?: Array<{
    __typename: "GroupTweetIgnore";
    id: string;
    url: string;
    ignoredBy: string;
    tweetId: string;
    ownerGroups?: Array<string | null> | null;
    scope: string;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetGroupTweetAnnotationsQuery = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupTweetAnnotationssQuery = {
  __typename: "ModelGroupTweetAnnotationsConnection";
  items?: Array<{
    __typename: "GroupTweetAnnotations";
    id: string;
    url: string;
    annotatedBy: string;
    tweetId: string;
    ownerGroups?: Array<string | null> | null;
    annotations?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncGroupTweetAnnotationsQuery = {
  __typename: "ModelGroupTweetAnnotationsConnection";
  items?: Array<{
    __typename: "GroupTweetAnnotations";
    id: string;
    url: string;
    annotatedBy: string;
    tweetId: string;
    ownerGroups?: Array<string | null> | null;
    annotations?: string | null;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type GetGroupTwitterUserIgnoreQuery = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type ListGroupTwitterUserIgnoresQuery = {
  __typename: "ModelGroupTwitterUserIgnoreConnection";
  items?: Array<{
    __typename: "GroupTwitterUserIgnore";
    id: string;
    twitterScreenName: string;
    ignoredBy: string;
    ownerGroups?: Array<string | null> | null;
    scope: string;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type SyncGroupTwitterUserIgnoresQuery = {
  __typename: "ModelGroupTwitterUserIgnoreConnection";
  items?: Array<{
    __typename: "GroupTwitterUserIgnore";
    id: string;
    twitterScreenName: string;
    ignoredBy: string;
    ownerGroups?: Array<string | null> | null;
    scope: string;
    _version: number;
    _deleted?: boolean | null;
    _lastChangedAt: number;
    createdAt: string;
    updatedAt: string;
  } | null> | null;
  nextToken?: string | null;
  startedAt?: number | null;
};

export type OnCreateUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteUserPreferencesSubscription = {
  __typename: "UserPreferences";
  id: string;
  owner?: string | null;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateUserDashboardSubscription = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateUserDashboardSubscription = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteUserDashboardSubscription = {
  __typename: "UserDashboard";
  id: string;
  owner?: string | null;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupDashboardSubscription = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupDashboardSubscription = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupDashboardSubscription = {
  __typename: "GroupDashboard";
  id: string;
  group: string;
  dashboard?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type OnUpdateUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type OnDeleteUserSessionSubscription = {
  __typename: "UserSession";
  id: string;
  fingerprint?: string | null;
  client?: string | null;
  open: boolean;
  group: string;
  owner?: string | null;
  ttl?: number | null;
  createdAt?: string | null;
  sessionId?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  updatedAt: string;
};

export type OnCreateGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupPreferencesSubscription = {
  __typename: "GroupPreferences";
  id: string;
  group: string;
  prefs?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupTweetIgnoreSubscription = {
  __typename: "GroupTweetIgnore";
  id: string;
  url: string;
  ignoredBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupTweetAnnotationsSubscription = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupTweetAnnotationsSubscription = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupTweetAnnotationsSubscription = {
  __typename: "GroupTweetAnnotations";
  id: string;
  url: string;
  annotatedBy: string;
  tweetId: string;
  ownerGroups?: Array<string | null> | null;
  annotations?: string | null;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnCreateGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnUpdateGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
};

export type OnDeleteGroupTwitterUserIgnoreSubscription = {
  __typename: "GroupTwitterUserIgnore";
  id: string;
  twitterScreenName: string;
  ignoredBy: string;
  ownerGroups?: Array<string | null> | null;
  scope: string;
  _version: number;
  _deleted?: boolean | null;
  _lastChangedAt: number;
  createdAt: string;
  updatedAt: string;
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
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
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
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
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
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
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
    return <DeleteUserPreferencesMutation>response.data.deleteUserPreferences;
  }
  async CreateUserDashboard(
    input: CreateUserDashboardInput,
    condition?: ModelUserDashboardConditionInput
  ): Promise<CreateUserDashboardMutation> {
    const statement = `mutation CreateUserDashboard($input: CreateUserDashboardInput!, $condition: ModelUserDashboardConditionInput) {
        createUserDashboard(input: $input, condition: $condition) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <CreateUserDashboardMutation>response.data.createUserDashboard;
  }
  async UpdateUserDashboard(
    input: UpdateUserDashboardInput,
    condition?: ModelUserDashboardConditionInput
  ): Promise<UpdateUserDashboardMutation> {
    const statement = `mutation UpdateUserDashboard($input: UpdateUserDashboardInput!, $condition: ModelUserDashboardConditionInput) {
        updateUserDashboard(input: $input, condition: $condition) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <UpdateUserDashboardMutation>response.data.updateUserDashboard;
  }
  async DeleteUserDashboard(
    input: DeleteUserDashboardInput,
    condition?: ModelUserDashboardConditionInput
  ): Promise<DeleteUserDashboardMutation> {
    const statement = `mutation DeleteUserDashboard($input: DeleteUserDashboardInput!, $condition: ModelUserDashboardConditionInput) {
        deleteUserDashboard(input: $input, condition: $condition) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <DeleteUserDashboardMutation>response.data.deleteUserDashboard;
  }
  async CreateGroupDashboard(
    input: CreateGroupDashboardInput,
    condition?: ModelGroupDashboardConditionInput
  ): Promise<CreateGroupDashboardMutation> {
    const statement = `mutation CreateGroupDashboard($input: CreateGroupDashboardInput!, $condition: ModelGroupDashboardConditionInput) {
        createGroupDashboard(input: $input, condition: $condition) {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <CreateGroupDashboardMutation>response.data.createGroupDashboard;
  }
  async UpdateGroupDashboard(
    input: UpdateGroupDashboardInput,
    condition?: ModelGroupDashboardConditionInput
  ): Promise<UpdateGroupDashboardMutation> {
    const statement = `mutation UpdateGroupDashboard($input: UpdateGroupDashboardInput!, $condition: ModelGroupDashboardConditionInput) {
        updateGroupDashboard(input: $input, condition: $condition) {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <UpdateGroupDashboardMutation>response.data.updateGroupDashboard;
  }
  async DeleteGroupDashboard(
    input: DeleteGroupDashboardInput,
    condition?: ModelGroupDashboardConditionInput
  ): Promise<DeleteGroupDashboardMutation> {
    const statement = `mutation DeleteGroupDashboard($input: DeleteGroupDashboardInput!, $condition: ModelGroupDashboardConditionInput) {
        deleteGroupDashboard(input: $input, condition: $condition) {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <DeleteGroupDashboardMutation>response.data.deleteGroupDashboard;
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
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
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
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
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
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
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
          prefs
          _version
          _deleted
          _lastChangedAt
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
          prefs
          _version
          _deleted
          _lastChangedAt
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
          prefs
          _version
          _deleted
          _lastChangedAt
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
          _version
          _deleted
          _lastChangedAt
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
          _version
          _deleted
          _lastChangedAt
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
          _version
          _deleted
          _lastChangedAt
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
  async CreateGroupTweetAnnotations(
    input: CreateGroupTweetAnnotationsInput,
    condition?: ModelGroupTweetAnnotationsConditionInput
  ): Promise<CreateGroupTweetAnnotationsMutation> {
    const statement = `mutation CreateGroupTweetAnnotations($input: CreateGroupTweetAnnotationsInput!, $condition: ModelGroupTweetAnnotationsConditionInput) {
        createGroupTweetAnnotations(input: $input, condition: $condition) {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
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
    return <CreateGroupTweetAnnotationsMutation>(
      response.data.createGroupTweetAnnotations
    );
  }
  async UpdateGroupTweetAnnotations(
    input: UpdateGroupTweetAnnotationsInput,
    condition?: ModelGroupTweetAnnotationsConditionInput
  ): Promise<UpdateGroupTweetAnnotationsMutation> {
    const statement = `mutation UpdateGroupTweetAnnotations($input: UpdateGroupTweetAnnotationsInput!, $condition: ModelGroupTweetAnnotationsConditionInput) {
        updateGroupTweetAnnotations(input: $input, condition: $condition) {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
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
    return <UpdateGroupTweetAnnotationsMutation>(
      response.data.updateGroupTweetAnnotations
    );
  }
  async DeleteGroupTweetAnnotations(
    input: DeleteGroupTweetAnnotationsInput,
    condition?: ModelGroupTweetAnnotationsConditionInput
  ): Promise<DeleteGroupTweetAnnotationsMutation> {
    const statement = `mutation DeleteGroupTweetAnnotations($input: DeleteGroupTweetAnnotationsInput!, $condition: ModelGroupTweetAnnotationsConditionInput) {
        deleteGroupTweetAnnotations(input: $input, condition: $condition) {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
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
    return <DeleteGroupTweetAnnotationsMutation>(
      response.data.deleteGroupTweetAnnotations
    );
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
          _version
          _deleted
          _lastChangedAt
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
          _version
          _deleted
          _lastChangedAt
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
          _version
          _deleted
          _lastChangedAt
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
  async GetUserPreferences(id: string): Promise<GetUserPreferencesQuery> {
    const statement = `query GetUserPreferences($id: ID!) {
        getUserPreferences(id: $id) {
          __typename
          id
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
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
            owner
            prefs
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
  async SyncUserPreferences(
    filter?: ModelUserPreferencesFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncUserPreferencesQuery> {
    const statement = `query SyncUserPreferences($filter: ModelUserPreferencesFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncUserPreferences(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            owner
            prefs
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncUserPreferencesQuery>response.data.syncUserPreferences;
  }
  async GetUserDashboard(id: string): Promise<GetUserDashboardQuery> {
    const statement = `query GetUserDashboard($id: ID!) {
        getUserDashboard(id: $id) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <GetUserDashboardQuery>response.data.getUserDashboard;
  }
  async ListUserDashboards(
    filter?: ModelUserDashboardFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListUserDashboardsQuery> {
    const statement = `query ListUserDashboards($filter: ModelUserDashboardFilterInput, $limit: Int, $nextToken: String) {
        listUserDashboards(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            owner
            dashboard
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    return <ListUserDashboardsQuery>response.data.listUserDashboards;
  }
  async SyncUserDashboards(
    filter?: ModelUserDashboardFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncUserDashboardsQuery> {
    const statement = `query SyncUserDashboards($filter: ModelUserDashboardFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncUserDashboards(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            owner
            dashboard
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncUserDashboardsQuery>response.data.syncUserDashboards;
  }
  async GetGroupDashboard(id: string): Promise<GetGroupDashboardQuery> {
    const statement = `query GetGroupDashboard($id: ID!) {
        getGroupDashboard(id: $id) {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
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
    return <GetGroupDashboardQuery>response.data.getGroupDashboard;
  }
  async ListGroupDashboards(
    filter?: ModelGroupDashboardFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListGroupDashboardsQuery> {
    const statement = `query ListGroupDashboards($filter: ModelGroupDashboardFilterInput, $limit: Int, $nextToken: String) {
        listGroupDashboards(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            group
            dashboard
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    return <ListGroupDashboardsQuery>response.data.listGroupDashboards;
  }
  async SyncGroupDashboards(
    filter?: ModelGroupDashboardFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncGroupDashboardsQuery> {
    const statement = `query SyncGroupDashboards($filter: ModelGroupDashboardFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncGroupDashboards(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            group
            dashboard
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncGroupDashboardsQuery>response.data.syncGroupDashboards;
  }
  async GetUserSession(id: string): Promise<GetUserSessionQuery> {
    const statement = `query GetUserSession($id: ID!) {
        getUserSession(id: $id) {
          __typename
          id
          fingerprint
          client
          open
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
          updatedAt
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
            group
            owner
            ttl
            createdAt
            sessionId
            _version
            _deleted
            _lastChangedAt
            updatedAt
          }
          nextToken
          startedAt
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
  async SyncUserSessions(
    filter?: ModelUserSessionFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncUserSessionsQuery> {
    const statement = `query SyncUserSessions($filter: ModelUserSessionFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncUserSessions(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            fingerprint
            client
            open
            group
            owner
            ttl
            createdAt
            sessionId
            _version
            _deleted
            _lastChangedAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncUserSessionsQuery>response.data.syncUserSessions;
  }
  async GetGroupPreferences(id: string): Promise<GetGroupPreferencesQuery> {
    const statement = `query GetGroupPreferences($id: ID!) {
        getGroupPreferences(id: $id) {
          __typename
          id
          group
          prefs
          _version
          _deleted
          _lastChangedAt
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
            prefs
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
  async SyncGroupPreferences(
    filter?: ModelGroupPreferencesFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncGroupPreferencesQuery> {
    const statement = `query SyncGroupPreferences($filter: ModelGroupPreferencesFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncGroupPreferences(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            group
            prefs
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncGroupPreferencesQuery>response.data.syncGroupPreferences;
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
          _version
          _deleted
          _lastChangedAt
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
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
  async SyncGroupTweetIgnores(
    filter?: ModelGroupTweetIgnoreFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncGroupTweetIgnoresQuery> {
    const statement = `query SyncGroupTweetIgnores($filter: ModelGroupTweetIgnoreFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncGroupTweetIgnores(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            url
            ignoredBy
            tweetId
            ownerGroups
            scope
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncGroupTweetIgnoresQuery>response.data.syncGroupTweetIgnores;
  }
  async GetGroupTweetAnnotations(
    id: string
  ): Promise<GetGroupTweetAnnotationsQuery> {
    const statement = `query GetGroupTweetAnnotations($id: ID!) {
        getGroupTweetAnnotations(id: $id) {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
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
    return <GetGroupTweetAnnotationsQuery>(
      response.data.getGroupTweetAnnotations
    );
  }
  async ListGroupTweetAnnotationss(
    filter?: ModelGroupTweetAnnotationsFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListGroupTweetAnnotationssQuery> {
    const statement = `query ListGroupTweetAnnotationss($filter: ModelGroupTweetAnnotationsFilterInput, $limit: Int, $nextToken: String) {
        listGroupTweetAnnotationss(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            id
            url
            annotatedBy
            tweetId
            ownerGroups
            annotations
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    return <ListGroupTweetAnnotationssQuery>(
      response.data.listGroupTweetAnnotationss
    );
  }
  async SyncGroupTweetAnnotations(
    filter?: ModelGroupTweetAnnotationsFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncGroupTweetAnnotationsQuery> {
    const statement = `query SyncGroupTweetAnnotations($filter: ModelGroupTweetAnnotationsFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncGroupTweetAnnotations(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            url
            annotatedBy
            tweetId
            ownerGroups
            annotations
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncGroupTweetAnnotationsQuery>(
      response.data.syncGroupTweetAnnotations
    );
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
          _version
          _deleted
          _lastChangedAt
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
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
  async SyncGroupTwitterUserIgnores(
    filter?: ModelGroupTwitterUserIgnoreFilterInput,
    limit?: number,
    nextToken?: string,
    lastSync?: number
  ): Promise<SyncGroupTwitterUserIgnoresQuery> {
    const statement = `query SyncGroupTwitterUserIgnores($filter: ModelGroupTwitterUserIgnoreFilterInput, $limit: Int, $nextToken: String, $lastSync: AWSTimestamp) {
        syncGroupTwitterUserIgnores(filter: $filter, limit: $limit, nextToken: $nextToken, lastSync: $lastSync) {
          __typename
          items {
            __typename
            id
            twitterScreenName
            ignoredBy
            ownerGroups
            scope
            _version
            _deleted
            _lastChangedAt
            createdAt
            updatedAt
          }
          nextToken
          startedAt
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
    if (lastSync) {
      gqlAPIServiceArguments.lastSync = lastSync;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <SyncGroupTwitterUserIgnoresQuery>(
      response.data.syncGroupTwitterUserIgnores
    );
  }
  OnCreateUserPreferencesListener: Observable<
    SubscriptionResponse<OnCreateUserPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateUserPreferences($owner: String) {
        onCreateUserPreferences(owner: $owner) {
          __typename
          id
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateUserPreferencesSubscription>>;

  OnUpdateUserPreferencesListener: Observable<
    SubscriptionResponse<OnUpdateUserPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateUserPreferences($owner: String) {
        onUpdateUserPreferences(owner: $owner) {
          __typename
          id
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateUserPreferencesSubscription>>;

  OnDeleteUserPreferencesListener: Observable<
    SubscriptionResponse<OnDeleteUserPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteUserPreferences($owner: String) {
        onDeleteUserPreferences(owner: $owner) {
          __typename
          id
          owner
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteUserPreferencesSubscription>>;

  OnCreateUserDashboardListener: Observable<
    SubscriptionResponse<OnCreateUserDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateUserDashboard($owner: String) {
        onCreateUserDashboard(owner: $owner) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateUserDashboardSubscription>>;

  OnUpdateUserDashboardListener: Observable<
    SubscriptionResponse<OnUpdateUserDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateUserDashboard($owner: String) {
        onUpdateUserDashboard(owner: $owner) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateUserDashboardSubscription>>;

  OnDeleteUserDashboardListener: Observable<
    SubscriptionResponse<OnDeleteUserDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteUserDashboard($owner: String) {
        onDeleteUserDashboard(owner: $owner) {
          __typename
          id
          owner
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteUserDashboardSubscription>>;

  OnCreateGroupDashboardListener: Observable<
    SubscriptionResponse<OnCreateGroupDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupDashboard {
        onCreateGroupDashboard {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateGroupDashboardSubscription>>;

  OnUpdateGroupDashboardListener: Observable<
    SubscriptionResponse<OnUpdateGroupDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupDashboard {
        onUpdateGroupDashboard {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateGroupDashboardSubscription>>;

  OnDeleteGroupDashboardListener: Observable<
    SubscriptionResponse<OnDeleteGroupDashboardSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupDashboard {
        onDeleteGroupDashboard {
          __typename
          id
          group
          dashboard
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteGroupDashboardSubscription>>;

  OnCreateUserSessionListener: Observable<
    SubscriptionResponse<OnCreateUserSessionSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateUserSession {
        onCreateUserSession {
          __typename
          id
          fingerprint
          client
          open
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateUserSessionSubscription>>;

  OnUpdateUserSessionListener: Observable<
    SubscriptionResponse<OnUpdateUserSessionSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateUserSession {
        onUpdateUserSession {
          __typename
          id
          fingerprint
          client
          open
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateUserSessionSubscription>>;

  OnDeleteUserSessionListener: Observable<
    SubscriptionResponse<OnDeleteUserSessionSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteUserSession {
        onDeleteUserSession {
          __typename
          id
          fingerprint
          client
          open
          group
          owner
          ttl
          createdAt
          sessionId
          _version
          _deleted
          _lastChangedAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteUserSessionSubscription>>;

  OnCreateGroupPreferencesListener: Observable<
    SubscriptionResponse<OnCreateGroupPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupPreferences {
        onCreateGroupPreferences {
          __typename
          id
          group
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateGroupPreferencesSubscription>>;

  OnUpdateGroupPreferencesListener: Observable<
    SubscriptionResponse<OnUpdateGroupPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupPreferences {
        onUpdateGroupPreferences {
          __typename
          id
          group
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateGroupPreferencesSubscription>>;

  OnDeleteGroupPreferencesListener: Observable<
    SubscriptionResponse<OnDeleteGroupPreferencesSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupPreferences {
        onDeleteGroupPreferences {
          __typename
          id
          group
          prefs
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteGroupPreferencesSubscription>>;

  OnCreateGroupTweetIgnoreListener: Observable<
    SubscriptionResponse<OnCreateGroupTweetIgnoreSubscription>
  > = API.graphql(
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
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnCreateGroupTweetIgnoreSubscription>>;

  OnUpdateGroupTweetIgnoreListener: Observable<
    SubscriptionResponse<OnUpdateGroupTweetIgnoreSubscription>
  > = API.graphql(
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
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnUpdateGroupTweetIgnoreSubscription>>;

  OnDeleteGroupTweetIgnoreListener: Observable<
    SubscriptionResponse<OnDeleteGroupTweetIgnoreSubscription>
  > = API.graphql(
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
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<SubscriptionResponse<OnDeleteGroupTweetIgnoreSubscription>>;

  OnCreateGroupTweetAnnotationsListener: Observable<
    SubscriptionResponse<OnCreateGroupTweetAnnotationsSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupTweetAnnotations {
        onCreateGroupTweetAnnotations {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnCreateGroupTweetAnnotationsSubscription>
  >;

  OnUpdateGroupTweetAnnotationsListener: Observable<
    SubscriptionResponse<OnUpdateGroupTweetAnnotationsSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupTweetAnnotations {
        onUpdateGroupTweetAnnotations {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnUpdateGroupTweetAnnotationsSubscription>
  >;

  OnDeleteGroupTweetAnnotationsListener: Observable<
    SubscriptionResponse<OnDeleteGroupTweetAnnotationsSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupTweetAnnotations {
        onDeleteGroupTweetAnnotations {
          __typename
          id
          url
          annotatedBy
          tweetId
          ownerGroups
          annotations
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnDeleteGroupTweetAnnotationsSubscription>
  >;

  OnCreateGroupTwitterUserIgnoreListener: Observable<
    SubscriptionResponse<OnCreateGroupTwitterUserIgnoreSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnCreateGroupTwitterUserIgnore {
        onCreateGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnCreateGroupTwitterUserIgnoreSubscription>
  >;

  OnUpdateGroupTwitterUserIgnoreListener: Observable<
    SubscriptionResponse<OnUpdateGroupTwitterUserIgnoreSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnUpdateGroupTwitterUserIgnore {
        onUpdateGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnUpdateGroupTwitterUserIgnoreSubscription>
  >;

  OnDeleteGroupTwitterUserIgnoreListener: Observable<
    SubscriptionResponse<OnDeleteGroupTwitterUserIgnoreSubscription>
  > = API.graphql(
    graphqlOperation(
      `subscription OnDeleteGroupTwitterUserIgnore {
        onDeleteGroupTwitterUserIgnore {
          __typename
          id
          twitterScreenName
          ignoredBy
          ownerGroups
          scope
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }`
    )
  ) as Observable<
    SubscriptionResponse<OnDeleteGroupTwitterUserIgnoreSubscription>
  >;
}
