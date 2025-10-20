import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { PermissionService } from '../services/permission.service';
import { SweetalertService } from '../services/sweetalert.service';
import { Logger } from '../services/logger.service';

@Injectable({
    providedIn: 'root'
})
export class GamesListGuard implements CanActivate {
    constructor(
        private permissionService: PermissionService,
        private router: Router,
        private sweetalert: SweetalertService
    ) {}

    canActivate(): Observable<boolean> {
        return this.permissionService.getAccessibleGameIds().pipe(
            take(1),
            map((accessibleGames) => accessibleGames.length > 0),
            tap((canAccess) => {
                if (!canAccess) {
                    Logger.log('Access denied to games list page.');
                    this.sweetalert.showToast('You do not have permission to access any games.', 'error');
                    this.router.navigate(['/app/dashboard']); // Redirect to dashboard or another appropriate page
                }
            })
        );
    }
}
