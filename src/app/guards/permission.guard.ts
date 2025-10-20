import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, take, tap, of } from 'rxjs';
import { PermissionService } from '../services/permission.service';
import { SweetalertService } from '../services/sweetalert.service';
import { Logger } from '../services/logger.service';

@Injectable({
    providedIn: 'root'
})
export class GamePermissionGuard implements CanActivate {
    constructor(
        private permissionService: PermissionService,
        private router: Router,
        private sweetalert: SweetalertService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // Extract game ID from route
        const gameId = parseInt(route.url[route.url.length - 1].path, 10);

        if (isNaN(gameId)) {
            Logger.warn('Invalid game ID in route');
            this.router.navigate(['app/game']);
            return of(false);
        }

        return this.permissionService.canAccessGame(gameId).pipe(
            take(1),
            tap((canAccess) => {
                if (!canAccess) {
                    Logger.log(`Access denied to game ${gameId}`);
                    this.sweetalert.showToast('ليس لديك صلاحية للوصول إلى هذه اللعبة', 'error');
                    this.router.navigate(['app/game']);
                }
            })
        );
    }
}

@Injectable({
    providedIn: 'root'
})
export class ScalePermissionGuard implements CanActivate {
    constructor(
        private permissionService: PermissionService,
        private router: Router,
        private sweetalert: SweetalertService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // Extract scale ID from route
        const scaleId = parseInt(route.url[route.url.length - 1].path, 10);

        if (isNaN(scaleId)) {
            Logger.warn('Invalid scale ID in route');
            this.router.navigate(['scales']);
            return of(false);
        }

        return this.permissionService.canAccessScale(scaleId).pipe(
            take(1),
            tap((canAccess) => {
                if (!canAccess) {
                    Logger.log(`Access denied to scale ${scaleId}`);
                    this.sweetalert.showToast('ليس لديك صلاحية للوصول إلى هذا المقياس', 'error');
                    this.router.navigate(['scales']);
                }
            })
        );
    }
}
