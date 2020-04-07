// tslint:disable
// eslint-disable
// this is an auto generated file. This will be overwritten

export const onCreateUserPreferences = /* GraphQL */ `
  subscription OnCreateUserPreferences($owner: String!) {
    onCreateUserPreferences(owner: $owner) {
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
export const onUpdateUserPreferences = /* GraphQL */ `
  subscription OnUpdateUserPreferences($owner: String!) {
    onUpdateUserPreferences(owner: $owner) {
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
export const onDeleteUserPreferences = /* GraphQL */ `
  subscription OnDeleteUserPreferences($owner: String!) {
    onDeleteUserPreferences(owner: $owner) {
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
export const onCreateTweetIgnore = /* GraphQL */ `
  subscription OnCreateTweetIgnore($owner: String!) {
    onCreateTweetIgnore(owner: $owner) {
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
export const onUpdateTweetIgnore = /* GraphQL */ `
  subscription OnUpdateTweetIgnore($owner: String!) {
    onUpdateTweetIgnore(owner: $owner) {
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
export const onDeleteTweetIgnore = /* GraphQL */ `
  subscription OnDeleteTweetIgnore($owner: String!) {
    onDeleteTweetIgnore(owner: $owner) {
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
export const onCreateTweetIrrelevant = /* GraphQL */ `
  subscription OnCreateTweetIrrelevant($owner: String!) {
    onCreateTweetIrrelevant(owner: $owner) {
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
export const onUpdateTweetIrrelevant = /* GraphQL */ `
  subscription OnUpdateTweetIrrelevant($owner: String!) {
    onUpdateTweetIrrelevant(owner: $owner) {
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
export const onDeleteTweetIrrelevant = /* GraphQL */ `
  subscription OnDeleteTweetIrrelevant($owner: String!) {
    onDeleteTweetIrrelevant(owner: $owner) {
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
export const onCreateTwitterUserIgnore = /* GraphQL */ `
  subscription OnCreateTwitterUserIgnore($owner: String!) {
    onCreateTwitterUserIgnore(owner: $owner) {
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
export const onUpdateTwitterUserIgnore = /* GraphQL */ `
  subscription OnUpdateTwitterUserIgnore($owner: String!) {
    onUpdateTwitterUserIgnore(owner: $owner) {
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
export const onDeleteTwitterUserIgnore = /* GraphQL */ `
  subscription OnDeleteTwitterUserIgnore($owner: String!) {
    onDeleteTwitterUserIgnore(owner: $owner) {
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
