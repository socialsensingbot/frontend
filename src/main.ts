import 'hammerjs';
import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import PubSub from '@aws-amplify/pubsub';
import Amplify, { Auth ,Storage } from 'aws-amplify';
import API from '@aws-amplify/api';
import awsconfig from './aws-exports';

API.configure(awsconfig);
PubSub.configure(awsconfig);
Amplify.configure(awsconfig);
// Storage.configure({ level: 'private' });

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
