import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router } from '@angular/router';
import { Observable } from 'rxjs';
import Auth from '@aws-amplify/auth';

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
  constructor( private _router: Router ) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return Auth.currentAuthenticatedUser()
            .then(() => {
              this._router.navigate(['/map'],{queryParamsHandling:"merge"});
              return false;
            })
            .catch(() => {
              return true;
            });
  }
}
