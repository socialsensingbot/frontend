import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import awsconfig from "./aws-exports";
import "@angular/compiler";
import {AppModule} from "./app/app.module";
import {environment} from "./environments/environment";
import Amplify, {Logger} from "@aws-amplify/core";



const log = new Logger("main");
try {
  // API.configure(awsconfig);
  // PubSub.configure(awsconfig);
  Amplify.configure(awsconfig);
  // Storage.configure({ level: 'private' });

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

  $("#loading-div-img").attr("src", "assets/loading-2.jpg");
} catch (e) {
  log.error(e);
  log.error("FATAL ERROR");
}
