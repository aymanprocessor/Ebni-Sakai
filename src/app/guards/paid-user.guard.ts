import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take, tap } from 'rxjs';
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
        return this.authService.currentUser$.pipe(
            take(1),
            map((user) => user?.isSubscribed === true || user?.role === 'admin'),
            tap((isPaidOrAdmin) => {
                if (!isPaidOrAdmin) {
                    console.log('Access denied - Paid subscription required');
                    this.router.navigate(['/subscription']);
                }
            })
        );
    }
}
