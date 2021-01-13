import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import PubSub from "@aws-amplify/pubsub";
import API from "@aws-amplify/api";
import awsconfig from "./aws-exports";
import "@angular/compiler";
const log = new Logger("main");

API.configure(awsconfig);
PubSub.configure(awsconfig);
Amplify.configure(awsconfig);
// Storage.configure({ level: 'private' });

import {AppModule} from "./app/app.module";
import {environment} from "./environments/environment";
import Amplify, {Logger} from "@aws-amplify/core";

if (environment.production) {
  enableProdMode();
  Amplify.Logger.LOG_LEVEL = "INFO";
} else {
  Amplify.Logger.LOG_LEVEL = "DEBUG";
}


if (window.location.search.indexOf("__debug__") >= 0) {
  Amplify.Logger.LOG_LEVEL = "VERBOSE";
}


log.info("**********************************");
log.info("*** Social Sensing Version " + environment.version);
log.info("**********************************");
log.info("");

const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);
bootstrap().catch(err => log.debug(err));
