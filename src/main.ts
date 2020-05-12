import 'hammerjs';
import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import PubSub from '@aws-amplify/pubsub';
import Amplify, {Auth, Logger, Storage} from 'aws-amplify';
import API from '@aws-amplify/api';
import awsconfig from './aws-exports';
const log = new Logger('main');

API.configure(awsconfig);
PubSub.configure(awsconfig);
Amplify.configure(awsconfig);
// Storage.configure({ level: 'private' });

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {hmrBootstrap} from "./hmr";
if (environment.production) {
  enableProdMode();
  Amplify.Logger.LOG_LEVEL = 'WARN';
} else {
  Amplify.Logger.LOG_LEVEL = 'DEBUG';
}


if(window.location.search.indexOf('__debug__') >= 0) {
  Amplify.Logger.LOG_LEVEL = 'VERBOSE';
}

log.info("**********************************")
log.info("*** Social Sensing Version "+environment.version);
log.info("**********************************")

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);

if (environment.hmr) {
  if (module[ 'hot' ]) {
    hmrBootstrap(module, bootstrap);
  } else {
    console.error('HMR is not enabled for webpack-dev-server!');
    log.debug('Are you using the --hmr flag for ng serve?');
  }
} else {
  bootstrap().catch(err => log.debug(err));
}
