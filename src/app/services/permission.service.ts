import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Observable, from, map, catchError, of, BehaviorSubject, combineLatest, filter } from 'rxjs';
import { RolePermissions } from '../models/permission.model';
import { Logger } from './logger.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class PermissionService {
    // Start as null to indicate "not yet loaded" so consumers can wait for real data
    private permissionsCache = new BehaviorSubject<Map<string, RolePermissions> | null>(null);
    // Public observable indicating whether role permissions have been loaded (non-null)
    public permissionsLoaded$ = this.permissionsCache.asObservable().pipe(map((pm) => pm !== null));

    constructor(
        private firestore: Firestore,
        private authService: AuthService
    ) {
        this.loadAllPermissions();
    }

    /**
     * Load all role permissions from Firestore
     */
    private loadAllPermissions(): void {
        const permissionsRef = collection(this.firestore, 'rolePermissions');
        getDocs(permissionsRef)
            .then((snapshot) => {
                const permMap = new Map<string, RolePermissions>();
                snapshot.forEach((doc) => {
                    const data = doc.data() as RolePermissions;
                    permMap.set(data.role, data);
                });
                this.permissionsCache.next(permMap);
                Logger.log('Loaded role permissions:', permMap);
            })
            .catch((error) => {
                Logger.error('Error loading permissions:', error);
            });
    }

    /**
     * Get permissions for a specific role
     */
    getRolePermissions(role: string): Observable<RolePermissions | null> {
        const docRef = doc(this.firestore, `rolePermissions/${role}`);
        return from(getDoc(docRef)).pipe(
            map((docSnap) => {
                if (docSnap.exists()) {
                    return docSnap.data() as RolePermissions;
                }
                // Return default permissions if not found
                return this.getDefaultPermissions(role);
            }),
            catchError((error) => {
                Logger.error('Error fetching role permissions:', error);
                return of(this.getDefaultPermissions(role));
            })
        );
    }

    /**
     * Update permissions for a specific role
     */
    async updateRolePermissions(rolePermissions: RolePermissions): Promise<void> {
        try {
            const docRef = doc(this.firestore, `rolePermissions/${rolePermissions.role}`);
            await setDoc(docRef, rolePermissions);

            // Update cache (create map if cache was not yet initialized)
            const currentCache = this.permissionsCache.value ?? new Map<string, RolePermissions>();
            currentCache.set(rolePermissions.role, rolePermissions);
            this.permissionsCache.next(currentCache);

            Logger.log('Updated role permissions:', rolePermissions);
        } catch (error) {
            Logger.error('Error updating role permissions:', error);
            throw error;
        }
    }

    /**
     * Check if current user has permission to access a game
     * Delegates to getAccessibleGameIds to ensure reactivity when permissionsCache or user profile change
     */
    canAccessGame(gameId: number): Observable<boolean> {
        return this.getAccessibleGameIds().pipe(map((ids) => ids.includes(gameId)));
    }

    /**
     * Check if current user has permission to access a scale
     * Delegates to getAccessibleScaleIds to ensure reactivity when permissionsCache or user profile change
     */
    canAccessScale(scaleId: number): Observable<boolean> {
        return this.getAccessibleScaleIds().pipe(map((ids) => ids.includes(scaleId)));
    }

    /**
     * Get filtered games based on user permissions
     */
    getAccessibleGameIds(): Observable<number[]> {
        // Wait until permissionsCache is loaded (non-null) before computing accessible IDs
        return combineLatest([this.authService.currentUser$, this.permissionsCache.asObservable().pipe(filter((pm): pm is Map<string, RolePermissions> => pm !== null))]).pipe(
            map(([user, permMap]) => {
                Logger.log('getAccessibleGameIds -> user role:', user?.role, 'isSubscribed:', user?.isSubscribed, 'permMapSize:', permMap?.size ?? 'null');
                Logger.log('getAccessibleGameIds -> user.gamePermissions:', user?.gamePermissions);
                if (!user) return [];

                // Admin and paid users see all games
                if (user.role === 'admin' || user.role === 'paid' || user.isSubscribed) {
                    return Array.from({ length: 52 }, (_, i) => i + 1); // All 52 games
                }

                // Check user-specific permissions only if not expired
                const now = new Date();
                const normalizeExpiry = (e: any) => {
                    if (!e) return null;
                    if (typeof e?.toDate === 'function') return e.toDate();
                    if (typeof e === 'number') return new Date(e);
                    if (typeof e === 'string') return new Date(e);
                    if (e instanceof Date) return e;
                    return null;
                };

                const gameExpiry = normalizeExpiry((user as any).gameAccessExpires);
                if (user.gamePermissions && user.gamePermissions.length > 0) {
                    // If an expiry exists and is in the past, ignore user-specific gamePermissions
                    if (!gameExpiry || gameExpiry > now) {
                        return user.gamePermissions.map((g: any) => Number(g));
                    } else {
                        Logger.log('User-specific game permissions expired for', user.uid);
                    }
                }

                // Check role-based permissions
                const rolePerms = permMap.get(user.role);
                Logger.log('getAccessibleGameIds -> rolePerms for', user?.role, ':', rolePerms);
                if (rolePerms && rolePerms.gamePermissions.length > 0) {
                    // ensure numbers
                    return rolePerms.gamePermissions.map((g: any) => Number(g));
                }

                return [];
            })
        );
    }

    /**
     * Get filtered scales based on user permissions
     */
    getAccessibleScaleIds(): Observable<number[]> {
        return combineLatest([this.authService.currentUser$, this.permissionsCache.asObservable().pipe(filter((pm): pm is Map<string, RolePermissions> => pm !== null))]).pipe(
            map(([user, permMap]) => {
                if (!user) return [];

                // Admin and paid users see all scales
                if (user.role === 'admin' || user.role === 'paid' || user.isSubscribed) {
                    return [1, 2, 3, 4, 5, 6, 7]; // All 7 scales
                }

                // Check user-specific permissions only if not expired
                const now = new Date();
                const normalizeExpiry = (e: any) => {
                    if (!e) return null;
                    if (typeof e?.toDate === 'function') return e.toDate();
                    if (typeof e === 'number') return new Date(e);
                    if (typeof e === 'string') return new Date(e);
                    if (e instanceof Date) return e;
                    return null;
                };

                const scaleExpiry = normalizeExpiry((user as any).scaleAccessExpires);
                if (user.scalePermissions && user.scalePermissions.length > 0) {
                    if (!scaleExpiry || scaleExpiry > now) {
                        return user.scalePermissions.map((s: any) => Number(s));
                    } else {
                        Logger.log('User-specific scale permissions expired for', user.uid);
                    }
                }

                // Check role-based permissions
                const rolePerms = permMap.get(user.role);
                if (rolePerms && rolePerms.scalePermissions.length > 0) {
                    return rolePerms.scalePermissions.map((s: any) => Number(s));
                }

                return [];
            })
        );
    }

    /**
     * Get all role permissions for admin management
     */
    getAllRolePermissions(): Observable<RolePermissions[]> {
        return from(getDocs(collection(this.firestore, 'rolePermissions'))).pipe(
            map((snapshot) => {
                return snapshot.docs.map((doc) => doc.data() as RolePermissions);
            }),
            catchError((error) => {
                Logger.error('Error fetching all role permissions:', error);
                return of([]);
            })
        );
    }

    /**
     * Get default permissions for a role
     */
    private getDefaultPermissions(role: string): RolePermissions {
        switch (role) {
            case 'admin':
                return {
                    role: 'admin',
                    gamePermissions: Array.from({ length: 52 }, (_, i) => i + 1),
                    scalePermissions: [1, 2, 3, 4, 5, 6, 7]
                };
            case 'paid':
                return {
                    role: 'paid',
                    gamePermissions: Array.from({ length: 52 }, (_, i) => i + 1),
                    scalePermissions: [1, 2, 3, 4, 5, 6, 7]
                };
            case 'specialist':
            case 'user':
            default:
                return {
                    role: role as any,
                    gamePermissions: [],
                    scalePermissions: []
                };
        }
    }

    /**
     * Update user-specific permissions (overrides role permissions)
     */
    async updateUserPermissions(userId: string, gamePermissions: number[], scalePermissions: number[], gameAccessExpires?: Date | null, scaleAccessExpires?: Date | null): Promise<void> {
        try {
            const userDocRef = doc(this.firestore, `users/${userId}`);
            const dataToSet: any = { gamePermissions, scalePermissions };
            if (typeof gameAccessExpires !== 'undefined') dataToSet.gameAccessExpires = gameAccessExpires;
            if (typeof scaleAccessExpires !== 'undefined') dataToSet.scaleAccessExpires = scaleAccessExpires;
            await setDoc(userDocRef, dataToSet, { merge: true });
            Logger.log('Updated user-specific permissions for:', userId);

            // Refresh the current user's profile if they are the one being updated
            const currentUser = this.authService.currentUser$.value;
            if (currentUser && currentUser.uid === userId) {
                await this.authService.refreshCurrentUserProfile();
                Logger.log('Current user profile refreshed after permission update');
            }
        } catch (error) {
            Logger.error('Error updating user permissions:', error);
            throw error;
        }
    }
}
