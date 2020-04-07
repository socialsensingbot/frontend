/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserPreferencesInput = {
  id?: string | null,
};

export type ModelUserPreferencesConditionInput = {
  and?: Array< ModelUserPreferencesConditionInput | null > | null,
  or?: Array< ModelUserPreferencesConditionInput | null > | null,
  not?: ModelUserPreferencesConditionInput | null,
};

export type UpdateUserPreferencesInput = {
  id: string,
};

export type DeleteUserPreferencesInput = {
  id?: string | null,
};

export type CreateTweetIgnoreInput = {
  id?: string | null,
  url: string,
  tweetId?: string | null,
  tweetIgnoreUserId?: string | null,
};

export type ModelTweetIgnoreConditionInput = {
  url?: ModelStringInput | null,
  tweetId?: ModelStringInput | null,
  and?: Array< ModelTweetIgnoreConditionInput | null > | null,
  or?: Array< ModelTweetIgnoreConditionInput | null > | null,
  not?: ModelTweetIgnoreConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
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
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type UpdateTweetIgnoreInput = {
  id: string,
  url?: string | null,
  tweetId?: string | null,
  tweetIgnoreUserId?: string | null,
};

export type DeleteTweetIgnoreInput = {
  id?: string | null,
};

export type CreateTweetIrrelevantInput = {
  id?: string | null,
  url: string,
  tweetId?: string | null,
  tweetIrrelevantUserId?: string | null,
};

export type ModelTweetIrrelevantConditionInput = {
  url?: ModelStringInput | null,
  tweetId?: ModelStringInput | null,
  and?: Array< ModelTweetIrrelevantConditionInput | null > | null,
  or?: Array< ModelTweetIrrelevantConditionInput | null > | null,
  not?: ModelTweetIrrelevantConditionInput | null,
};

export type UpdateTweetIrrelevantInput = {
  id: string,
  url?: string | null,
  tweetId?: string | null,
  tweetIrrelevantUserId?: string | null,
};

export type DeleteTweetIrrelevantInput = {
  id?: string | null,
};

export type CreateTwitterUserIgnoreInput = {
  id?: string | null,
  twitterScreenName: string,
  twitterUserIgnoreUserId?: string | null,
};

export type ModelTwitterUserIgnoreConditionInput = {
  twitterScreenName?: ModelStringInput | null,
  and?: Array< ModelTwitterUserIgnoreConditionInput | null > | null,
  or?: Array< ModelTwitterUserIgnoreConditionInput | null > | null,
  not?: ModelTwitterUserIgnoreConditionInput | null,
};

export type UpdateTwitterUserIgnoreInput = {
  id: string,
  twitterScreenName?: string | null,
  twitterUserIgnoreUserId?: string | null,
};

export type DeleteTwitterUserIgnoreInput = {
  id?: string | null,
};

export type ModelUserPreferencesFilterInput = {
  id?: ModelIDInput | null,
  and?: Array< ModelUserPreferencesFilterInput | null > | null,
  or?: Array< ModelUserPreferencesFilterInput | null > | null,
  not?: ModelUserPreferencesFilterInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelTweetIgnoreFilterInput = {
  id?: ModelIDInput | null,
  url?: ModelStringInput | null,
  tweetId?: ModelStringInput | null,
  and?: Array< ModelTweetIgnoreFilterInput | null > | null,
  or?: Array< ModelTweetIgnoreFilterInput | null > | null,
  not?: ModelTweetIgnoreFilterInput | null,
};

export type ModelTweetIrrelevantFilterInput = {
  id?: ModelIDInput | null,
  url?: ModelStringInput | null,
  tweetId?: ModelStringInput | null,
  and?: Array< ModelTweetIrrelevantFilterInput | null > | null,
  or?: Array< ModelTweetIrrelevantFilterInput | null > | null,
  not?: ModelTweetIrrelevantFilterInput | null,
};

export type ModelTwitterUserIgnoreFilterInput = {
  id?: ModelIDInput | null,
  twitterScreenName?: ModelStringInput | null,
  and?: Array< ModelTwitterUserIgnoreFilterInput | null > | null,
  or?: Array< ModelTwitterUserIgnoreFilterInput | null > | null,
  not?: ModelTwitterUserIgnoreFilterInput | null,
};

export type CreateUserPreferencesMutationVariables = {
  input: CreateUserPreferencesInput,
  condition?: ModelUserPreferencesConditionInput | null,
};

export type CreateUserPreferencesMutation = {
  createUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type UpdateUserPreferencesMutationVariables = {
  input: UpdateUserPreferencesInput,
  condition?: ModelUserPreferencesConditionInput | null,
};

export type UpdateUserPreferencesMutation = {
  updateUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type DeleteUserPreferencesMutationVariables = {
  input: DeleteUserPreferencesInput,
  condition?: ModelUserPreferencesConditionInput | null,
};

export type DeleteUserPreferencesMutation = {
  deleteUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type CreateTweetIgnoreMutationVariables = {
  input: CreateTweetIgnoreInput,
  condition?: ModelTweetIgnoreConditionInput | null,
};

export type CreateTweetIgnoreMutation = {
  createTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type UpdateTweetIgnoreMutationVariables = {
  input: UpdateTweetIgnoreInput,
  condition?: ModelTweetIgnoreConditionInput | null,
};

export type UpdateTweetIgnoreMutation = {
  updateTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type DeleteTweetIgnoreMutationVariables = {
  input: DeleteTweetIgnoreInput,
  condition?: ModelTweetIgnoreConditionInput | null,
};

export type DeleteTweetIgnoreMutation = {
  deleteTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type CreateTweetIrrelevantMutationVariables = {
  input: CreateTweetIrrelevantInput,
  condition?: ModelTweetIrrelevantConditionInput | null,
};

export type CreateTweetIrrelevantMutation = {
  createTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type UpdateTweetIrrelevantMutationVariables = {
  input: UpdateTweetIrrelevantInput,
  condition?: ModelTweetIrrelevantConditionInput | null,
};

export type UpdateTweetIrrelevantMutation = {
  updateTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type DeleteTweetIrrelevantMutationVariables = {
  input: DeleteTweetIrrelevantInput,
  condition?: ModelTweetIrrelevantConditionInput | null,
};

export type DeleteTweetIrrelevantMutation = {
  deleteTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type CreateTwitterUserIgnoreMutationVariables = {
  input: CreateTwitterUserIgnoreInput,
  condition?: ModelTwitterUserIgnoreConditionInput | null,
};

export type CreateTwitterUserIgnoreMutation = {
  createTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type UpdateTwitterUserIgnoreMutationVariables = {
  input: UpdateTwitterUserIgnoreInput,
  condition?: ModelTwitterUserIgnoreConditionInput | null,
};

export type UpdateTwitterUserIgnoreMutation = {
  updateTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type DeleteTwitterUserIgnoreMutationVariables = {
  input: DeleteTwitterUserIgnoreInput,
  condition?: ModelTwitterUserIgnoreConditionInput | null,
};

export type DeleteTwitterUserIgnoreMutation = {
  deleteTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type GetUserPreferencesQueryVariables = {
  id: string,
};

export type GetUserPreferencesQuery = {
  getUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type ListUserPreferencessQueryVariables = {
  filter?: ModelUserPreferencesFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUserPreferencessQuery = {
  listUserPreferencess:  {
    __typename: "ModelUserPreferencesConnection",
    items:  Array< {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null > | null,
    nextToken: string | null,
  } | null,
};

export type GetTweetIgnoreQueryVariables = {
  id: string,
};

export type GetTweetIgnoreQuery = {
  getTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type ListTweetIgnoresQueryVariables = {
  filter?: ModelTweetIgnoreFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTweetIgnoresQuery = {
  listTweetIgnores:  {
    __typename: "ModelTweetIgnoreConnection",
    items:  Array< {
      __typename: "TweetIgnore",
      id: string,
      url: string,
      tweetId: string | null,
      owner: string | null,
    } | null > | null,
    nextToken: string | null,
  } | null,
};

export type GetTweetIrrelevantQueryVariables = {
  id: string,
};

export type GetTweetIrrelevantQuery = {
  getTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type ListTweetIrrelevantsQueryVariables = {
  filter?: ModelTweetIrrelevantFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTweetIrrelevantsQuery = {
  listTweetIrrelevants:  {
    __typename: "ModelTweetIrrelevantConnection",
    items:  Array< {
      __typename: "TweetIrrelevant",
      id: string,
      url: string,
      tweetId: string | null,
      owner: string | null,
    } | null > | null,
    nextToken: string | null,
  } | null,
};

export type GetTwitterUserIgnoreQueryVariables = {
  id: string,
};

export type GetTwitterUserIgnoreQuery = {
  getTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type ListTwitterUserIgnoresQueryVariables = {
  filter?: ModelTwitterUserIgnoreFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTwitterUserIgnoresQuery = {
  listTwitterUserIgnores:  {
    __typename: "ModelTwitterUserIgnoreConnection",
    items:  Array< {
      __typename: "TwitterUserIgnore",
      id: string,
      twitterScreenName: string,
      owner: string | null,
    } | null > | null,
    nextToken: string | null,
  } | null,
};

export type OnCreateUserPreferencesSubscriptionVariables = {
  owner: string,
};

export type OnCreateUserPreferencesSubscription = {
  onCreateUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnUpdateUserPreferencesSubscriptionVariables = {
  owner: string,
};

export type OnUpdateUserPreferencesSubscription = {
  onUpdateUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnDeleteUserPreferencesSubscriptionVariables = {
  owner: string,
};

export type OnDeleteUserPreferencesSubscription = {
  onDeleteUserPreferences:  {
    __typename: "UserPreferences",
    id: string,
    ignoreTweets:  {
      __typename: "ModelTweetIgnoreConnection",
      nextToken: string | null,
    } | null,
    ignorePeople:  {
      __typename: "ModelTwitterUserIgnoreConnection",
      nextToken: string | null,
    } | null,
    irrelevant:  {
      __typename: "ModelTweetIrrelevantConnection",
      nextToken: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnCreateTweetIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnCreateTweetIgnoreSubscription = {
  onCreateTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnUpdateTweetIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnUpdateTweetIgnoreSubscription = {
  onUpdateTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnDeleteTweetIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnDeleteTweetIgnoreSubscription = {
  onDeleteTweetIgnore:  {
    __typename: "TweetIgnore",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnCreateTweetIrrelevantSubscriptionVariables = {
  owner: string,
};

export type OnCreateTweetIrrelevantSubscription = {
  onCreateTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnUpdateTweetIrrelevantSubscriptionVariables = {
  owner: string,
};

export type OnUpdateTweetIrrelevantSubscription = {
  onUpdateTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnDeleteTweetIrrelevantSubscriptionVariables = {
  owner: string,
};

export type OnDeleteTweetIrrelevantSubscription = {
  onDeleteTweetIrrelevant:  {
    __typename: "TweetIrrelevant",
    id: string,
    url: string,
    tweetId: string | null,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnCreateTwitterUserIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnCreateTwitterUserIgnoreSubscription = {
  onCreateTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnUpdateTwitterUserIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnUpdateTwitterUserIgnoreSubscription = {
  onUpdateTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};

export type OnDeleteTwitterUserIgnoreSubscriptionVariables = {
  owner: string,
};

export type OnDeleteTwitterUserIgnoreSubscription = {
  onDeleteTwitterUserIgnore:  {
    __typename: "TwitterUserIgnore",
    id: string,
    twitterScreenName: string,
    user:  {
      __typename: "UserPreferences",
      id: string,
      owner: string | null,
    } | null,
    owner: string | null,
  } | null,
};
