import {Component} from '@angular/core';
import {FormGroup, FormControl, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {CognitoUser} from '@aws-amplify/auth';
import {NotificationService} from 'src/app/services/notification.service';
import {Router} from '@angular/router';
import {environment} from 'src/environments/environment';

@Component({
             selector:    'app-sign-in',
             templateUrl: './sign-in.component.html',
             styleUrls:   ['./sign-in.component.scss']
           })
export class SignInComponent {

  signinForm: FormGroup = new FormGroup({
                                          email:    new FormControl('', [Validators.email, Validators.required]),
                                          password: new FormControl('', [Validators.required, Validators.min(6)])
                                        });

  hide = true;

  get emailInput() { return this.signinForm.get('email'); }

  get passwordInput() { return this.signinForm.get('password'); }

  constructor(
    public auth: AuthService,
    private _notification: NotificationService,
    private _router: Router) { }

  getEmailInputError() {
    if (this.emailInput.hasError('email')) {
      return 'Please enter a valid email address.';
    }
    if (this.emailInput.hasError('required')) {
      return 'An Email is required.';
    }
  }

  getPasswordInputError() {
    if (this.passwordInput.hasError('required')) {
      return 'A password is required.';
    }
  }

  signIn() {
    this.auth.signIn(this.emailInput.value, this.passwordInput.value)
        .then((user: CognitoUser | any) => {
          /**
           * If a user account is created by an admin in Cognito the password is
           * temporary. The user will not be able to login until they have set this
           * password. The following code detects that and sends them to the New Password
           * page.
           */
          console.log(user.challengeName);
          if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
            this._router.navigate(['auth/newpass'],{queryParamsHandling:"merge",state:{
              message:"Please Change your Temporary Password"
              }});
            return;
          } else {
            console.log(user.challengeName);// other situations
            this._router.navigate(['/map'],{queryParamsHandling:"merge"});
          }
        })
        .catch((error: any) => {
          this._notification.show(error.message);
          switch (error.code) {
            case "UserNotConfirmedException":
              environment.confirm.email = this.emailInput.value;
              environment.confirm.password = this.passwordInput.value;
              this._router.navigate(['auth/confirm'],{queryParamsHandling:"merge"});
              break;
            case "UsernameExistsException":
              this._router.navigate(['auth/signin'],{queryParamsHandling:"merge"});
              break;
          }
        })
  }

}
