import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, from, map, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AdminGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // First wait for the auth service to initialize
        return from(this.authService.waitForInitialization()).pipe(
            switchMap(() => this.authService.currentUser$),
            take(1),
            map((user) => user?.role === 'admin'),
            tap((isAdmin) => {
                if (!isAdmin) {
                    console.log('Access denied - Admin role required');
                    this.router.navigate(['app/dashboard']);
                }
            })
        );
    }
}
