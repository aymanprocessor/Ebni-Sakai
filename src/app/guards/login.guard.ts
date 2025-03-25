import { inject, Injectable } from '@angular/core';
import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, from, of } from 'rxjs';
import { catchError, map, take, timeout } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const RedirectLoggedInGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    return authState(auth).pipe(
        map((user) => {
            if (user) {
                console.log('User is logged in');
                router.navigate(['app/dashboard']);
                return false;
            } else {
                console.log('User is not logged in');
                return true;
            }
        })
    );
};
