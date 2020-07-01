import {Injectable, NgZone, OnDestroy, OnInit} from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import {Subscription} from 'rxjs';
import {environment} from "../../environments/environment";
import {Logger} from "aws-amplify";

const log = new Logger('map');

/**
 * Provides an abstract wrapper around showing a MatSnackbar
 * notification based on global environment or API provided
 * configuration.
 *
 * This class Listens for the authentication state to change.
 * Once the state becomes authenticated, retrieve the startup
 * configuration from the API service. Once de-authenticated
 * set the _params to undefined and unsubscribe.
 */
@Injectable({
              providedIn: 'root'
            })
export class NotificationService implements OnDestroy, OnInit {


  // Configuration api subscription
  private _configState: Subscription;

  /**
   * Constructor
   * @param toast  {MatSnackBar}
   */
  constructor(
    private toast: MatSnackBar, private _zone: NgZone) {

  }

  ngOnInit(): void {

  }

  /**
   * Unsubscribe from the config state
   * when the component is destroyed, and remove
   * the in-memory parameters.
   */
  ngOnDestroy() {
    this._configState.unsubscribe();
  }

  /**
   * Display a MatSnackbar notification and return the reference.
   * Will set the duration to the global configuration if present.
   * @param message {string}
   * @param buttonLabel {string}
   * @returns {MatSnackBarRef}
   */
  show(message: string, buttonLabel: string = 'OK', toastTimeout = 8): MatSnackBarRef<any> {
    if (toastTimeout > 0) {
      return this.toast.open(message, buttonLabel, {
        duration: toastTimeout * 1000
      });
    } else {
      return this.toast.open(message, buttonLabel, {});
    }
  }

  public error(e: any) {
    if (environment.production) {
      console.error(e);
    } else {
      log.error(e);
      return this.toast.open(`ERROR: ${e.toString()} (this message will not appear in production)`, "got it", {
        duration:   30000,
        politeness: "assertive",
      });

    }
  }
}
