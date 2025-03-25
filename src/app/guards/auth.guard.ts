import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Auth, authState } from '@angular/fire/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    return authState(auth).pipe(
        map((user) => {
            if (!user) {
                console.log('no user');
                router.navigate(['auth/login']);
                return false;
            } else {
                console.log('user');
                return true;
            }
        })
    );
};
