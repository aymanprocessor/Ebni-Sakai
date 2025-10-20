import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { Router } from '@angular/router';
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Logger } from '../../services/logger.service';

interface GameAccess {
    id: number;
    name: string;
    nameAr: string;
    hasAccess: boolean;
}

interface ScaleAccess {
    id: number;
    name: string;
    nameAr: string;
    hasAccess: boolean;
}

@Component({
    selector: 'app-my-access',
    standalone: true,
    imports: [CommonModule, CardModule, ButtonModule, TagModule, DividerModule, SkeletonModule, TranslateModule],
    templateUrl: './my-access.component.html',
    styleUrls: ['./my-access.component.scss']
})
export class MyAccessComponent implements OnInit, OnDestroy {
    loading = true;
    currentUser: any = null;

    games: GameAccess[] = [];
    scales: ScaleAccess[] = [];

    accessibleGames: number[] = [];
    accessibleScales: number[] = [];

    totalGames = 52;
    totalScales = 7;

    private destroy$ = new Subject<void>();

    constructor(
        private permissionService: PermissionService,
        private authService: AuthService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadUserAccess();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUserAccess(): void {
        this.loading = true;

        // Get current user
        this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
            this.currentUser = user;
            Logger.log('Current user in My Access page:', user);
        });

        // Get accessible games
        this.permissionService
            .getAccessibleGameIds()
            .pipe(takeUntil(this.destroy$))
            .subscribe((gameIds) => {
                this.accessibleGames = gameIds;
                this.initializeGames();
                Logger.log('Accessible games:', gameIds);
            });

        // Get accessible scales
        this.permissionService
            .getAccessibleScaleIds()
            .pipe(takeUntil(this.destroy$))
            .subscribe((scaleIds) => {
                this.accessibleScales = scaleIds;
                this.initializeScales();
                Logger.log('Accessible scales:', scaleIds);
                this.loading = false;
            });
    }

    initializeGames(): void {
        this.games = [];
        for (let i = 1; i <= this.totalGames; i++) {
            this.games.push({
                id: i,
                name: `Game ${i}`,
                nameAr: `لعبة ${i}`,
                hasAccess: this.accessibleGames.includes(i)
            });
        }
    }

    initializeScales(): void {
        const scaleNames = [
            { en: 'Scale 1: Assessment Scale', ar: 'مقياس ١: مقياس التقييم' },
            { en: 'Scale 2: Development Scale', ar: 'مقياس ٢: مقياس التطور' },
            { en: 'Scale 3: Behavioral Scale', ar: 'مقياس ٣: مقياس السلوك' },
            { en: 'Scale 4: Cognitive Scale', ar: 'مقياس ٤: مقياس الإدراك' },
            { en: 'Scale 5: Social Scale', ar: 'مقياس ٥: مقياس الاجتماعي' },
            { en: 'Scale 6: Emotional Scale', ar: 'مقياس ٦: مقياس العاطفي' },
            { en: 'Scale 7: Language Scale', ar: 'مقياس ٧: مقياس اللغة' }
        ];

        this.scales = [];
        for (let i = 1; i <= this.totalScales; i++) {
            this.scales.push({
                id: i,
                name: scaleNames[i - 1]?.en || `Scale ${i}`,
                nameAr: scaleNames[i - 1]?.ar || `مقياس ${i}`,
                hasAccess: this.accessibleScales.includes(i)
            });
        }
    }

    get accessibleGamesCount(): number {
        return this.accessibleGames.length;
    }

    get accessibleScalesCount(): number {
        return this.accessibleScales.length;
    }

    get gamesAccessPercentage(): number {
        return this.totalGames > 0 ? Math.round((this.accessibleGamesCount / this.totalGames) * 100) : 0;
    }

    get scalesAccessPercentage(): number {
        return this.totalScales > 0 ? Math.round((this.accessibleScalesCount / this.totalScales) * 100) : 0;
    }

    get isAdmin(): boolean {
        return this.currentUser?.role === 'admin';
    }

    get isPaid(): boolean {
        return this.currentUser?.role === 'paid' || this.currentUser?.isSubscribed;
    }

    navigateToGame(gameId: number): void {
        if (this.accessibleGames.includes(gameId)) {
            this.router.navigate(['/game', gameId]);
        }
    }

    navigateToScale(scaleId: number): void {
        if (this.accessibleScales.includes(scaleId)) {
            this.router.navigate(['/app', 'scales', scaleId]);
        }
    }

    navigateToGamesList(): void {
        this.router.navigate(['/app/game']);
    }

    navigateToScalesList(): void {
        this.router.navigate(['/app', 'scales']);
    }

    refreshAccess(): void {
        this.authService
            .refreshCurrentUserProfile()
            .then(() => {
                this.loadUserAccess();
            })
            .catch((error) => {
                Logger.error('Error refreshing user profile:', error);
            });
    }

    // Return the nearest (earliest) expiry date among games/scales, normalized to Date
    getNearestExpiry(): Date | null {
        if (!this.currentUser) return null;
        const gameExp = this.currentUser.gameAccessExpires ? new Date(this.currentUser.gameAccessExpires as any) : null;
        const scaleExp = this.currentUser.scaleAccessExpires ? new Date(this.currentUser.scaleAccessExpires as any) : null;

        if (gameExp && scaleExp) {
            return gameExp <= scaleExp ? gameExp : scaleExp;
        }
        return gameExp || scaleExp;
    }

    onPayNow(): void {
        // Placeholder: navigate to subscription / payment page (implement payment flow separately)
        this.router.navigate(['/app', 'subscription']);
    }
}
