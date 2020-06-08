import {Component, OnInit} from '@angular/core';
import {FormGroup, FormControl, Validators, ValidationErrors} from '@angular/forms';
import {AuthService} from '../auth.service';
import {CognitoUser} from '@aws-amplify/auth';
import {NotificationService} from 'src/app/services/notification.service';
import {ActivatedRoute, Router} from '@angular/router';
import {environment} from 'src/environments/environment';
import {Auth, Logger} from "aws-amplify";
const log = new Logger("new-pass");

/**
 * The New Password Component exists for when a user is forced by Cognito to change their
 * password. Primarily that is to allow the user to change the Admin set temporary password.
 */
@Component({
             selector:    'app-new-pass',
             templateUrl: './new-pass.component.html',
             styleUrls:   ['./new-pass.component.scss']
           })
export class NewPassComponent implements OnInit {

  changePassForm: FormGroup = new FormGroup({
                                              password: new FormControl('', [Validators.required, Validators.min(8)]),
                                              confirm:  new FormControl('', [Validators.required, Validators.min(8),
                                                                             control => {
                                                                               let errors: ValidationErrors = {};
                                                                               if (this && this.changePassForm && this.passwordInput.value !== control.value) {
                                                                                 errors.different = "Password and confirmation are not the same."
                                                                               }
                                                                               return errors;
                                                                             }])
                                            });

  hide = true;
  message: string= "Change Password";

  get passwordInput() { return this.changePassForm.get('password'); }

  get confirmInput() { return this.changePassForm.get('confirm'); }

  constructor(
    public auth: AuthService,
    private _notification: NotificationService,
    private _router: Router,
    private route: ActivatedRoute) {

    this.message=_router.getCurrentNavigation().extras.state.message;
  }


  getPasswordError() {
    if (this.passwordInput.hasError('required')) {
      return 'Please supply a password.';
    }
  }

  getConfirmPasswordError() {
    if (this.confirmInput.hasError('required')) {
      return 'Please confirm password.';
    }
    if (this.confirmInput.hasError('different')) {
      return 'Password and confirmation do not match';
    }
  }

  changePass() {
    log.debug("changePass()");
    return this.auth.completeNewPassword(this.passwordInput.value).then(() => {
      log.debug("completed new password");
      this._router.navigate(['/map'], {queryParamsHandling: "merge"});
    }).catch(e => log.error(e));
  }


  public ngOnInit(): void {

  }
}
