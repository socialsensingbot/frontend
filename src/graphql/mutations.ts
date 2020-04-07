// tslint:disable
// eslint-disable
// this is an auto generated file. This will be overwritten

export const createUserPreferences = /* GraphQL */ `
  mutation CreateUserPreferences(
    $input: CreateUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    createUserPreferences(input: $input, condition: $condition) {
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
export const updateUserPreferences = /* GraphQL */ `
  mutation UpdateUserPreferences(
    $input: UpdateUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    updateUserPreferences(input: $input, condition: $condition) {
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
export const deleteUserPreferences = /* GraphQL */ `
  mutation DeleteUserPreferences(
    $input: DeleteUserPreferencesInput!
    $condition: ModelUserPreferencesConditionInput
  ) {
    deleteUserPreferences(input: $input, condition: $condition) {
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
export const createTweetIgnore = /* GraphQL */ `
  mutation CreateTweetIgnore(
    $input: CreateTweetIgnoreInput!
    $condition: ModelTweetIgnoreConditionInput
  ) {
    createTweetIgnore(input: $input, condition: $condition) {
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
export const updateTweetIgnore = /* GraphQL */ `
  mutation UpdateTweetIgnore(
    $input: UpdateTweetIgnoreInput!
    $condition: ModelTweetIgnoreConditionInput
  ) {
    updateTweetIgnore(input: $input, condition: $condition) {
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
export const deleteTweetIgnore = /* GraphQL */ `
  mutation DeleteTweetIgnore(
    $input: DeleteTweetIgnoreInput!
    $condition: ModelTweetIgnoreConditionInput
  ) {
    deleteTweetIgnore(input: $input, condition: $condition) {
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
export const createTweetIrrelevant = /* GraphQL */ `
  mutation CreateTweetIrrelevant(
    $input: CreateTweetIrrelevantInput!
    $condition: ModelTweetIrrelevantConditionInput
  ) {
    createTweetIrrelevant(input: $input, condition: $condition) {
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
export const updateTweetIrrelevant = /* GraphQL */ `
  mutation UpdateTweetIrrelevant(
    $input: UpdateTweetIrrelevantInput!
    $condition: ModelTweetIrrelevantConditionInput
  ) {
    updateTweetIrrelevant(input: $input, condition: $condition) {
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
export const deleteTweetIrrelevant = /* GraphQL */ `
  mutation DeleteTweetIrrelevant(
    $input: DeleteTweetIrrelevantInput!
    $condition: ModelTweetIrrelevantConditionInput
  ) {
    deleteTweetIrrelevant(input: $input, condition: $condition) {
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
export const createTwitterUserIgnore = /* GraphQL */ `
  mutation CreateTwitterUserIgnore(
    $input: CreateTwitterUserIgnoreInput!
    $condition: ModelTwitterUserIgnoreConditionInput
  ) {
    createTwitterUserIgnore(input: $input, condition: $condition) {
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
export const updateTwitterUserIgnore = /* GraphQL */ `
  mutation UpdateTwitterUserIgnore(
    $input: UpdateTwitterUserIgnoreInput!
    $condition: ModelTwitterUserIgnoreConditionInput
  ) {
    updateTwitterUserIgnore(input: $input, condition: $condition) {
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
export const deleteTwitterUserIgnore = /* GraphQL */ `
  mutation DeleteTwitterUserIgnore(
    $input: DeleteTwitterUserIgnoreInput!
    $condition: ModelTwitterUserIgnoreConditionInput
  ) {
    deleteTwitterUserIgnore(input: $input, condition: $condition) {
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
