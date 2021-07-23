// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';



const { UserPreferences, UserDashboard, GroupDashboard, SavedGraph, UserSession, GroupPreferences, GroupTweetIgnore, GroupTweetAnnotations, GroupTwitterUserIgnore } = initSchema(schema);

export {
  UserPreferences,
  UserDashboard,
  GroupDashboard,
  SavedGraph,
  UserSession,
  GroupPreferences,
  GroupTweetIgnore,
  GroupTweetAnnotations,
  GroupTwitterUserIgnore
};