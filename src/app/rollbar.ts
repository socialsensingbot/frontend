import * as Rollbar from 'rollbar'; // When using Typescript < 3.6.0.
// `import Rollbar from 'rollbar';` is the required syntax for Typescript 3.6.x.
// However, it will only work when setting either `allowSyntheticDefaultImports`
// or `esModuleInterop` in your Typescript options.

import {
  Injectable,
  Inject,
  InjectionToken,
  ErrorHandler
} from '@angular/core';

import {environment} from "../environments/environment";
import {NotificationService} from "./services/notification.service";

const rollbarConfig = {
  accessToken:                'd22c641642f94b619b51f31de651e7b9',
  captureUncaught:            environment.rollbar,
  captureUnhandledRejections: environment.rollbar,
};

export const RollbarService = new InjectionToken<Rollbar>('rollbar');

@Injectable()
export class RollbarErrorHandler implements ErrorHandler {
  constructor(@Inject(RollbarService) private rollbar: Rollbar, private _notify: NotificationService) {}

  handleError(err: any): void {
    if (environment.rollbar) {
      this.rollbar.error(err.originalError || err);
    } else {
      this._notify.error(err);
    }
  }
}

export function rollbarFactory() {
  return new Rollbar(rollbarConfig);
}
