import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authServ: AuthService = inject(AuthService);
    const router: Router = inject(Router);

    return authServ.currentUser$.pipe(
        take(1),
        map((user) => {
            if (!user) {
                router.navigateByUrl('auth/login');
                return false;
            }
            return true;
        })
    );
};
