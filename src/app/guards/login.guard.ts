import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class LoginGuard implements CanActivate {
    constructor(
        private auth: Auth,
        private router: Router
    ) {}

    canActivate(): Observable<boolean> {
        return new Observable<boolean>((observer) => {
            const unsubscribe = this.auth.onAuthStateChanged((user) => {
                if (user) {
                    // User is already logged in, redirect to dashboard
                    this.router.navigateByUrl('app/dashboard');
                    observer.next(false);
                } else {
                    // User is not logged in, allow access to login page
                    observer.next(true);
                }
                observer.complete();
                unsubscribe();
            });
        }).pipe(take(1));
    }
}
