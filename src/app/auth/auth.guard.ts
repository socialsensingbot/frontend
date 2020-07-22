import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import Auth from '@aws-amplify/auth';
import {Logger} from "aws-amplify";
import {Observable} from 'rxjs';

const log = new Logger('auth-guard');

/**
 * THe AuthGuard prevents access to routes without prior authentication. If the user
 * is not authenticated they will be redirected to auth/signin route.
 *
 * https://angular.io/guide/router
 * https://aws-amplify.github.io/docs/js/authentication
 */
@Injectable({
              providedIn: "root"
            })
export class AuthGuard implements CanActivate {
  constructor(private _router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return Auth.currentAuthenticatedUser().then(() => { return true; })
               .catch((e) => {
                 log.debug(e);
                 this._router.navigate(["auth/signin"],
                                       {queryParams: {_return: location.href}, queryParamsHandling: "merge"});
                 return false;
               });
  }
}
