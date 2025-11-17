import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { SCALES_LIST } from '../scales-list';
import { PermissionService } from '../../../services/permission.service';
import { Logger } from '../../../services/logger.service';
import { AuthService } from '../../../services/auth.service';
import { combineLatest } from 'rxjs';

@Component({
    selector: 'app-scales-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule],
    template: `
        <div class="scales-page">
            <header class="hero">
                <h1>المقاييس</h1>

                <!-- Attribution (localized) -->
                <p class="scale-note">{{ 'pages.scales.attribution' | translate }}</p>

                <p>اختر المقياس لتشغيله</p>
            </header>

            <main>
                <!-- Shimmer placeholders while permissions are being resolved -->
                <div *ngIf="accessibleScaleIds === null" class="shimmer-grid">
                    <div *ngFor="let i of [1, 2, 3, 4]" class="shimmer-card">
                        <div class="shimmer-badge"></div>
                        <div class="shimmer-lines">
                            <div class="shimmer-line short"></div>
                            <div class="shimmer-line long"></div>
                        </div>
                    </div>
                </div>

                <!-- Render scales only after permissions are loaded -->
                <div *ngIf="accessibleScaleIds !== null" class="grid">
                    <a *ngFor="let s of filteredScales" [routerLink]="['/app', 'scales', s.number]" class="card">
                        <div class="card-inner">
                            <div class="badge">{{ s.number }}</div>
                            <h2 class="title">{{ s.title }}</h2>
                            <a
                                *ngIf="s.videoUrl"
                                [href]="s.videoUrl"
                                class="yt-link"
                                [title]="'common.watchOnYouTube' | translate"
                                target="_blank"
                                rel="noopener noreferrer"
                                [attr.aria-label]="'common.watchOnYouTube' | translate"
                                (click)="$event.stopPropagation()"
                            >
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                    <path
                                        d="M23.5 6.2s-.2-1.7-.8-2.5c-.8-1-1.7-1.1-2.1-1.2C16.6 2 12 2 12 2h-.1s-4.6 0-8.6.5c-.5.1-1.3.2-2.1 1.2C.5 4.5.3 6.2.3 6.2S0 8.1 0 10v4c0 1.9.3 3.8.3 3.8s.2 1.7.8 2.5c.8 1 1.9 1 2.4 1.2 1.7.2 7.2.5 8.5.5h.1s4.6 0 8.6-.5c.5-.1 1.3-.2 2.1-1.2.6-.8.8-2.5.8-2.5S24 15.9 24 14v-4c0-1.9-.5-3.8-.5-3.8z"
                                        fill="#FF0000"
                                    />
                                    <path d="M9.5 15.6V8.4L15.8 12l-6.3 3.6z" fill="#fff" />
                                </svg>
                            </a>
                        </div>
                    </a>
                </div>

                <!-- No results message when permissions loaded but no accessible scales -->
                <div *ngIf="accessibleScaleIds !== null && filteredScales.length === 0" class="no-results text-center">
                    <p>ليس لديك أية مقاييس متاحة.</p>
                </div>
            </main>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                padding: 24px;
                box-sizing: border-box;
            }
            .hero {
                text-align: center;
                margin-bottom: 18px;
            }
            .hero h1 {
                margin: 0;
                font-size: 28px;
            }
            .hero p {
                margin: 4px 0 0;
                color: #666;
            }

            .scale-note {
                margin: 6px 0 0;
                color: #475569;
                font-size: 0.95rem;
                font-weight: 600;
                opacity: 0.95;
            }

            .scale-note-en {
                font-weight: 500;
                color: #6b7280;
                font-size: 0.9rem;
                margin-top: 2px;
            }

            .grid {
                display: grid;
                /* two columns layout */
                grid-template-columns: repeat(2, minmax(220px, 1fr));
                gap: 16px;
                align-items: stretch;
            }

            .card {
                text-decoration: none;
                color: inherit;
                background: linear-gradient(135deg, #fff, #f7fbff);
                border-radius: 12px;
                padding: 20px;
                min-height: 110px; /* increased height */
                margin-bottom: 12px; /* extra bottom spacing to emphasize height */
                box-shadow: 0 6px 18px rgba(18, 38, 63, 0.06);
                transition:
                    transform 0.18s ease,
                    box-shadow 0.18s ease;
                display: block;
            }
            .card:hover {
                transform: translateY(-6px);
                box-shadow: 0 12px 30px rgba(18, 38, 63, 0.12);
            }
            .card-inner {
                display: flex;
                align-items: center;
                gap: 16px;
                height: 100%;
            }
            .badge {
                width: 72px;
                height: 72px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(180deg, #2b6dfa, #1e4ed8);
                color: white;
                font-weight: 800;
                font-size: 22px;
            }
            .title {
                margin: 0;
                font-size: 18px;
                line-height: 1.2;
            }
            .cta {
                margin: 0;
                margin-left: auto;
                color: #1e4ed8;
                font-weight: 600;
            }
            .yt-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                margin-inline-start: auto;
                text-decoration: none;
                transition:
                    transform 120ms ease,
                    box-shadow 120ms ease;
            }
            .yt-link:hover {
                transform: translateY(-2px);
            }
            .yt-link svg {
                display: block;
            }

            @media (max-width: 520px) {
                .grid {
                    grid-template-columns: 1fr;
                }
                .card {
                    margin-bottom: 18px;
                }
            }
            /* Shimmer placeholder styles */
            .shimmer-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(220px, 1fr));
                gap: 16px;
                padding: 16px 0;
            }
            .shimmer-card {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 16px;
                border-radius: 12px;
                background: linear-gradient(180deg, #fff, #fbfbff);
                box-shadow: 0 6px 18px rgba(18, 38, 63, 0.04);
            }
            .shimmer-badge {
                width: 72px;
                height: 72px;
                border-radius: 12px;
                background: linear-gradient(90deg, #eef2ff 0%, #f8fafc 50%, #eef2ff 100%);
                position: relative;
                overflow: hidden;
            }
            .shimmer-lines {
                flex: 1;
            }
            .shimmer-line {
                height: 12px;
                background: linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%);
                margin-bottom: 8px;
                border-radius: 6px;
                position: relative;
                overflow: hidden;
            }
            .shimmer-line.short {
                width: 40%;
            }
            .shimmer-line.long {
                width: 80%;
            }
            .shimmer-card::before,
            .shimmer-badge::before,
            .shimmer-line::before {
                content: '';
                position: absolute;
                top: 0;
                left: -150px;
                height: 100%;
                width: 150px;
                background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0));
                transform: skewX(-20deg);
                animation: shimmer 1.2s infinite;
            }
            @keyframes shimmer {
                to {
                    transform: translateX(320px) skewX(-20deg);
                }
            }
        `
    ]
})
export class ScalesListComponent implements OnInit {
    scales = SCALES_LIST;
    // Start empty to avoid flashing all items before permissions are applied
    filteredScales: typeof SCALES_LIST = [] as any;
    // null = loading, [] = loaded but no access
    accessibleScaleIds: number[] | null = null;
    private initialized = false;

    constructor(
        private permissionService: PermissionService,
        private ngZone: NgZone,
        private cd: ChangeDetectorRef,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        // Load accessible scale IDs based on user permissions
        // Wait for both permissions cache to be loaded and auth to be initialized to avoid race
        combineLatest([this.permissionService.permissionsLoaded$, this.authService.initialized$]).subscribe(([permsLoaded, authInit]) => {
            Logger.log('ScalesList: permsLoaded=', permsLoaded, 'authInit=', authInit);
            if (!permsLoaded || !authInit) {
                // still waiting; keep skeleton
                return;
            }

            this.permissionService.getAccessibleScaleIds().subscribe((ids) => {
                // ensure UI updates when AngularFire emits outside Angular zone
                this.ngZone.run(() => {
                    Logger.log('ScalesList: accessibleScaleIds emitted:', ids);
                    this.accessibleScaleIds = ids;
                    this.initialized = true;

                    if (this.accessibleScaleIds === null) {
                        // still loading -> keep empty to avoid flashing full list
                        this.filteredScales = [];
                    } else if (this.accessibleScaleIds.length === 0 && this.initialized) {
                        this.filteredScales = [];
                    } else {
                        this.filteredScales = this.scales.filter((s) => (this.accessibleScaleIds ?? []).includes(s.number));
                    }

                    try {
                        this.cd.detectChanges();
                    } catch (e) {
                        this.cd.markForCheck();
                    }
                });
            });
        });
    }
}
