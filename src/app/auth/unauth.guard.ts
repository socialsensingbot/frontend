import {Injectable, NgZone} from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router, ActivatedRoute
} from '@angular/router';
import Auth from '@aws-amplify/auth';
import {Observable} from 'rxjs';
/**
 * Prevents the user from accessing signup/signin pages when they are already authenticated.
 * This is used as a guard around those routes.
 *
 * https://angular.io/guide/router
 * https://aws-amplify.github.io/docs/js/authentication
 *
 */
@Injectable({
  providedIn: 'root'
})
export class UnauthGuard implements CanActivate {
  constructor(private _router: Router, private _route: ActivatedRoute) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return Auth.currentAuthenticatedUser()
               .then(() => {
                 window.location.replace(this._route.snapshot.queryParams["_return"]);
                 return false;
               })
               .catch(() => {
                 return true;
            });
  }
}
