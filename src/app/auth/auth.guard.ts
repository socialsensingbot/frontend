import {Injectable} from '@angular/core';
import {CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';
import Auth from '@aws-amplify/auth';

@Injectable({
              providedIn: 'root'
            })
export class AuthGuard implements CanActivate {
  constructor(private _router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return Auth.currentAuthenticatedUser().then(() => { return true; })
               .catch(() => {
                 console.log("Routing with preserved params ");
                 var search = location.search.substring(1);
                 const params = JSON.parse(
                   '{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
                 this._router.navigate(['auth/signin'], {queryParams: params, queryParamsHandling: "merge"});
                 return false;
               });
  }
}
