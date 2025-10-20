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
export class ScalesListGuard implements CanActivate {
    constructor(
        private permissionService: PermissionService,
        private router: Router,
        private sweetalert: SweetalertService
    ) {}

    canActivate(): Observable<boolean> {
        return this.permissionService.getAccessibleScaleIds().pipe(
            take(1),
            map((accessibleScales) => accessibleScales.length > 0),
            tap((canAccess) => {
                if (!canAccess) {
                    Logger.log('Access denied to scales list page.');
                    this.sweetalert.showToast('You do not have permission to access any scales.', 'error');
                    this.router.navigate(['/app/dashboard']); // Redirect to dashboard or another appropriate page
                }
            })
        );
    }
}
