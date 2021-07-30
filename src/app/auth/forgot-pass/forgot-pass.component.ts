import {Component, OnInit} from "@angular/core";
import {FormGroup, FormControl, Validators, ValidationErrors} from "@angular/forms";
import {AuthService} from "../auth.service";
import {Auth} from "@aws-amplify/auth";
import {NotificationService} from "src/app/services/notification.service";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "src/environments/environment";
import {Logger} from "@aws-amplify/core";
import {LoadingProgressService} from "../../services/loading-progress.service";

const log = new Logger("forgot-pass");

/**
 * The Forgot Password Component exists for when a user has forgotten their password.
 */
@Component({
             selector:    "app-forgot-pass",
             templateUrl: "./forgot-pass.component.html",
             styleUrls:   ["./forgot-pass.component.scss"]
           })
export class ForgotPassComponent implements OnInit {
  buttonColor = environment.toolbarColor;

  signinForm: FormGroup = new FormGroup({
                                          email: new FormControl("", [Validators.email, Validators.required])
                                        });


  hide = true;
  message = "Forgot Password";

  get emailInput() { return this.signinForm.get("email"); }


  constructor(
    public auth: AuthService,
    private _notification: NotificationService,
    private _router: Router,
    private _route: ActivatedRoute, private loading: LoadingProgressService) {

    // this.message = _router.getCurrentNavigation().extras.state.message;
    if (_route.snapshot.queryParams.username) {
      this.emailInput.setValue(_route.snapshot.queryParams.username);
    }
  }

  ngOnInit(): void {
      this.loading.loaded();
  }


  getEmailInputError() {
    if (this.emailInput.hasError("required")) {
      return "Please supply username in the form of an email address.";
    }
  }

  forgotPass() {
    log.debug("changePass()");
    return this.auth.forgotPassword(this.emailInput.value).then(() => {
      log.debug("completed forgot password");
      // window.location.replace(this._route.snapshot.queryParams._return);
      this.message = "An email has been sent to you with a code for resetting your password.";
      this._router.navigate(["/auth/resetpass"],
                            {queryParamsHandling: "merge", queryParams: {username: this.emailInput.value}});
    }).catch(e => {
      log.error(e);
      if (e.hasOwnProperty("message")) {
        this._notification.show(e.message);
      }
    });
  }


}
