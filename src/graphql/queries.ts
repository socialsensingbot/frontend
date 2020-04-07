// tslint:disable
// eslint-disable
// this is an auto generated file. This will be overwritten

export const getUserPreferences = /* GraphQL */ `
  query GetUserPreferences($id: ID!) {
    getUserPreferences(id: $id) {
      id
      ignoreTweets {
        nextToken
      }
      ignorePeople {
        nextToken
      }
      irrelevant {
        nextToken
      }
      owner
    }
  }
`;
export const listUserPreferencess = /* GraphQL */ `
  query ListUserPreferencess(
    $filter: ModelUserPreferencesFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUserPreferencess(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        owner
      }
      nextToken
    }
  }
`;
export const getTweetIgnore = /* GraphQL */ `
  query GetTweetIgnore($id: ID!) {
    getTweetIgnore(id: $id) {
      id
      url
      tweetId
      user {
        id
        owner
      }
      owner
    }
  }
`;
export const listTweetIgnores = /* GraphQL */ `
  query ListTweetIgnores(
    $filter: ModelTweetIgnoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTweetIgnores(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        url
        tweetId
        owner
      }
      nextToken
    }
  }
`;
export const getTweetIrrelevant = /* GraphQL */ `
  query GetTweetIrrelevant($id: ID!) {
    getTweetIrrelevant(id: $id) {
      id
      url
      tweetId
      user {
        id
        owner
      }
      owner
    }
  }
`;
export const listTweetIrrelevants = /* GraphQL */ `
  query ListTweetIrrelevants(
    $filter: ModelTweetIrrelevantFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTweetIrrelevants(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        url
        tweetId
        owner
      }
      nextToken
    }
  }
`;
export const getTwitterUserIgnore = /* GraphQL */ `
  query GetTwitterUserIgnore($id: ID!) {
    getTwitterUserIgnore(id: $id) {
      id
      twitterScreenName
      user {
        id
        owner
      }
      owner
    }
  }
`;
export const listTwitterUserIgnores = /* GraphQL */ `
  query ListTwitterUserIgnores(
    $filter: ModelTwitterUserIgnoreFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTwitterUserIgnores(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        twitterScreenName
        owner
      }
      nextToken
    }
  }
`;
