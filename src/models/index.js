// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { UserPreferences, UserSession, GroupPreferences, GroupTweetIgnore, GroupTweetAnnotations, GroupTwitterUserIgnore } = initSchema(schema);

export {
  UserPreferences,
  UserSession,
  GroupPreferences,
  GroupTweetIgnore,
  GroupTweetAnnotations,
  GroupTwitterUserIgnore
};