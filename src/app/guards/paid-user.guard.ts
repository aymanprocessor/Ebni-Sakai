import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, from, map, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class PaidUserGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return from(this.authService.waitForInitialization()).pipe(
            switchMap(() => this.authService.currentUser$),
            take(1),
            map((user) => user?.isSubscribed === true || user?.role === 'user'),
            tap((isSubscribed) => {
                if (!isSubscribed) {
                    console.log('Access denied - Paid User role required');
                    this.router.navigate(['app/dashboard']);
                }
            })
        );
    }
}
