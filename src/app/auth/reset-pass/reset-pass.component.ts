import {Component, OnInit} from "@angular/core";
import {FormGroup, FormControl, Validators, ValidationErrors} from "@angular/forms";
import {AuthService} from "../auth.service";
import {Auth} from "@aws-amplify/auth";
import {NotificationService} from "src/app/services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "src/environments/environment";
import {Logger} from "@aws-amplify/core";

const log = new Logger("reset-pass");

/**
 * The Reset Password Component exists for when a user has requested Cognito to reset their
 * password.
 */
@Component({
             selector:    "app-reset-pass",
             templateUrl: "./reset-pass.component.html",
             styleUrls:   ["./reset-pass.component.scss"]
           })
export class ResetPassComponent implements OnInit {
  buttonColor = environment.toolbarColor;
  changePassForm: FormGroup = new FormGroup({
                                              email:    new FormControl("", [Validators.email, Validators.required]),
                                              code:     new FormControl("", [Validators.pattern(/\d{4,}/),
                                                                             Validators.required]),
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
  message = "Reset Password";

  get passwordInput() { return this.changePassForm.get("password"); }

  get emailInput() { return this.changePassForm.get("email"); }

  get codeInput() { return this.changePassForm.get("code"); }

  get confirmInput() { return this.changePassForm.get("confirm"); }

  constructor(
    public auth: AuthService,
    private _notification: NotificationService,
    private _router: Router,
    private _route: ActivatedRoute) {

    if (_route.snapshot.queryParams.username) {
      this.emailInput.setValue(_route.snapshot.queryParams.username);
    }

    // this.message = _router.getCurrentNavigation().extras.state.message;
  }

  ngOnInit(): void {
    $("#loading-div").remove();
  }


  getEmailInputError() {
    if (this.emailInput.hasError("email")) {
      return "Please enter a valid email address.";
    }
    if (this.emailInput.hasError("required")) {
      return "Your username (email) is required.";
    }
  }

  getCodeInputError() {
    if (this.codeInput.hasError("required")) {
      return "Please supply the code from the email we sent.";
    }
    if (this.codeInput.hasError("pattern")) {
      return "Invalid code, please supply the code from the email we sent.";
    }
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


  public resetPass() {
    return this.auth.resetPassword(this.emailInput.value, this.codeInput.value, this.passwordInput.value).then(() => {
      log.debug("completed new password");
      if (this._route.snapshot.queryParams._return) {
        window.location.replace(this._route.snapshot.queryParams._return);
      } else {
        this._router.navigate(["/"]);
      }
    }).catch(e => {
      log.error(e);
      if (e.hasOwnProperty("message")) {
        this._notification.show(e.message);
      }
    });

  }
}
