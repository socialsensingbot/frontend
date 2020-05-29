import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';
import Auth from '@aws-amplify/auth';
import {Logger} from "aws-amplify";
const log = new Logger('auth-guard');

/**
 * THe AuthGuard prevents access to routes without prior authentication. If the user
 * is not authenticated they will be redirected to auth/signin route.
 *
 * https://angular.io/guide/router
 * https://aws-amplify.github.io/docs/js/authentication
 */
@Injectable({
              providedIn: 'root'
            })
export class AuthGuard implements CanActivate {
  constructor(private _router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return Auth.currentAuthenticatedUser().then(() => { return true; })
               .catch((e) => {
                 log.debug(e);
                 log.debug("Routing with preserved params ");
                 // The following is a fix for this really infuriating issue in Angular
                 // https://github.com/angular/angular/issues/12664
                 // Basically Angular loses the query paremeters such that the usual
                 // queryParamsHandling: "merge" would have no effect. This code is
                 // a work around that grabs the params from the URL directly and
                 // then explicitly passes them to the _router.navigate(... request.
                 var search = location.search.substring(1);
                 let params;
                 if (search.length > 0) {
                   //https://stackoverflow.com/questions/8648892/how-to-convert-url-parameters-to-a-javascript-object
                     params = JSON.parse(
                       '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                 } else {
                   params = {};
                 }
                 this._router.navigate(['auth/signin'], {queryParams: params, queryParamsHandling: "merge"});
                 return false;
               });
  }
}
