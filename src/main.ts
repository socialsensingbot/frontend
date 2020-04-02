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
import {hmrBootstrap} from "./hmr";

if (environment.production) {
  enableProdMode();
}

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);

if (environment.hmr) {
  if (module[ 'hot' ]) {
    hmrBootstrap(module, bootstrap);
  } else {
    console.error('HMR is not enabled for webpack-dev-server!');
    console.log('Are you using the --hmr flag for ng serve?');
  }
} else {
  bootstrap().catch(err => console.log(err));
}
