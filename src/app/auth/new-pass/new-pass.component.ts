import {Component, OnInit} from "@angular/core";
import {FormGroup, FormControl, Validators, ValidationErrors} from "@angular/forms";
import {AuthService} from "../auth.service";
import {Auth} from "@aws-amplify/auth";
import {NotificationService} from "src/app/services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "src/environments/environment";
import { Logger} from "@aws-amplify/core";

const log = new Logger("new-pass");

/**
 * The New Password Component exists for when a user is forced by Cognito to change their
 * password. Primarily that is to allow the user to change the Admin set temporary password.
 */
@Component({
             selector:    "app-new-pass",
             templateUrl: "./new-pass.component.html",
             styleUrls:   ["./new-pass.component.scss"]
           })
export class NewPassComponent implements OnInit {
  buttonColor = environment.toolbarColor;
  changePassForm: FormGroup = new FormGroup({
                                              password: new FormControl("", [Validators.required, Validators.min(8)]),
                                              confirm:  new FormControl("", [Validators.required, Validators.min(8),
                                                                             control => {
                                                                               const errors: ValidationErrors = {};
                                                                               if (this && this.changePassForm && this.passwordInput.value !== control.value) {
                                                                                 errors.different = "Password and confirmation are not the same.";
                                                                               }
                                                                               return errors;
                                                                             }])
                                            });

  hide = true;
  message = "Change Password";

  get passwordInput() { return this.changePassForm.get("password"); }

  get confirmInput() { return this.changePassForm.get("confirm"); }

  constructor(
    public auth: AuthService,
    private _notification: NotificationService,
    private _router: Router,
    private _route: ActivatedRoute) {

    this.message = _router.getCurrentNavigation().extras.state.message;
  }

  ngOnInit(): void {
    $("#loading-div").remove();
  }


  getPasswordError() {
    if (this.passwordInput.hasError("required")) {
      return "Please supply a password.";
    }
  }

  getConfirmPasswordError() {
    if (this.confirmInput.hasError("required")) {
      return "Please confirm password.";
    }
    if (this.confirmInput.hasError("different")) {
      return "Password and confirmation do not match";
    }
  }

  changePass() {
    log.debug("changePass()");
    return this.auth.completeNewPassword(this.passwordInput.value).then(() => {
      log.debug("completed new password");
      window.location.replace(this._route.snapshot.queryParams._return);

    }).catch(e => log.error(e));
  }


}
