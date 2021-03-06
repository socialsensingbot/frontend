import {Injectable} from '@angular/core';
import Auth from '@aws-amplify/auth';
import {Hub} from '@aws-amplify/core';
import {Observable, Subject} from 'rxjs';
import {CognitoUser} from 'amazon-cognito-identity-js';
import {Logger} from "@aws-amplify/core";
import {DataStore} from "@aws-amplify/datastore";

export interface NewUser {
  email: string,
  password: string,
  firstName: string,
  lastName: string
}

const log = new Logger('auth');

/**
 * A support service for managing authentication. Wraps the Amplify Auth.xxx requests.
 * See https://docs.amplify.aws/lib/auth/getting-started?platform=js
 */
@Injectable({
              providedIn: 'root'
            })
export class AuthService {

  public loggedIn: boolean;
  private _authState: Subject<CognitoUser | any> = new Subject<CognitoUser | any>();
  private _user: CognitoUser;
  public state: Observable<CognitoUser | any> = this._authState.asObservable();

  public static SIGN_IN = 'signIn';
  public static SIGN_OUT = 'signOut';

  constructor() {
    Hub.listen('auth', (data) => {
      const {channel, payload} = data;
      if (channel === 'auth') {
        this._authState.next(payload.event);
      }
    });
  }

  signUp(user: NewUser): Promise<CognitoUser | any> {
    return Auth.signUp({
                         "username":   user.email,
                         "password":   user.password,
                         "attributes": {
                           "email":       user.email,
                           "given_name":  user.firstName,
                           "family_name": user.lastName
                         }
                       });
  }

  signIn(username: string, password: string): Promise<CognitoUser | any> {
    return new Promise((resolve, reject) => {
      Auth.signIn(username, password)
          .then((user: CognitoUser | any) => {
            this.loggedIn = true;
            this._user = user;
            resolve(user);
          }).catch((error: any) => reject(error));
    });

  }

  async signOut(): Promise<any> {
    this.loggedIn = false;
    await DataStore.clear();
    return Auth.signOut()
               .then(() => this.loggedIn = false);
  }

  public completeNewPassword(password: any): Promise<any> {
    log.debug("completeNewPassword()");
    return new Promise((resolve, reject) => {

                         log.debug("completeNewPassword() authState");
                         Auth.completeNewPassword(this._user, password,       /* the new password*/ {}).then(user => {
                           this.loggedIn = true;
                           resolve(user);
                         }).catch(e => {
                           reject(e);
                         });
                       }
    );

  }

  public async email() {
    return (await this.userInfo()).attributes.email;
  }

  public async userInfo() {
    return Auth.currentUserInfo();
  }
}
