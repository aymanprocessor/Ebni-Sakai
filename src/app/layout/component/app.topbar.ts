import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { AuthService } from '../../services/auth.service';
import { Observable, map, of } from 'rxjs';
import { ViewChild } from '@angular/core';
import { Popover } from 'primeng/popover';

@Component({
    selector: 'app-topbar',

    standalone: true,
    imports: [RouterModule, TranslateModule, CommonModule, StyleClassModule, LanguageSelectorComponent, ButtonModule, PopoverModule, AppConfigurator],
    template: `
        <div class="layout-topbar">
            <div class="layout-topbar-logo-container">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo" routerLink="/">
                    <img src="assets/images/Logo.png" alt="kid Skills logo" style="width: 50px;" />

                    <span>KID SKILLS</span>
                </a>
            </div>

            <!-- Centered trial badge with sticky positioning -->
            <div class="center-trial-badge-sticky" aria-hidden="false">
                <ng-container *ngIf="trialDays$ | async as days">
                    <button
                        *ngIf="days !== null"
                        type="button"
                        class="trial-badge-alert"
                        [ngClass]="days <= 3 ? 'p-message p-message-warn' : 'p-message p-message-success'"
                        (click)="subscriptionPopover.toggle($event)"
                        [title]="'MY_ACCESS.TRIAL_EXPIRES' | translate"
                        [attr.aria-label]="'MY_ACCESS.TRIAL_LEFT' | translate: { days: days }"
                    >
                        <div class="p-message-wrapper">
                            <i [class]="days <= 3 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'"></i>
                            <span class="trial-badge-text">{{ 'MY_ACCESS.TRIAL_LEFT' | translate: { days: days } }}</span>
                            <span class="trial-badge-dots">•••</span>
                        </div>
                    </button>
                </ng-container>
            </div>

            <div class="layout-topbar-actions">
                <div class="layout-config-menu">
                    <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                        <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                    </button>
                    <div class="relative">
                        <button
                            class="layout-topbar-action layout-topbar-action-highlight"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-palette"></i>
                        </button>
                        <app-configurator />
                    </div>
                </div>

                <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                    <i class="pi pi-ellipsis-v"></i>
                </button>

                <div class="layout-topbar-menu hidden lg:block">
                    <div class="layout-topbar-menu-content">
                        <app-language-selector></app-language-selector>
                        <button type="button" class="layout-topbar-action">
                            <i class="pi pi-inbox"></i>
                            <span>{{ 'topbar.messages' | translate }}</span>
                        </button>
                        <button type="button" (click)="op.toggle($event)" class="layout-topbar-action relative">
                            <i class="pi pi-user"></i>
                            <span>{{ 'topbar.profile' | translate }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <p-popover #op>
            <p-button label="{{ 'common.buttons.logout' | translate }}" (click)="logout()" variant="text" severity="danger" />
        </p-popover>

        <!-- Subscription Info Popover -->
        <p-popover #subscriptionPopover>
            <div class="subscription-popup">
                <h3>{{ 'subscription.howToSubscribe' | translate }}</h3>
                <div class="subscription-content">
                    <div class="trial-info">
                        <i class="pi pi-clock"></i>
                        <span *ngIf="trialDays$ | async as days">
                            {{ 'subscription.trialEndsIn' | translate: { days: days } }}
                        </span>
                    </div>
                    <div class="steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>{{ 'subscription.step1Title' | translate }}</h4>
                                <p>{{ 'subscription.step1Desc' | translate }}</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>{{ 'subscription.step2Title' | translate }}</h4>
                                <p>{{ 'subscription.step2Desc' | translate }}</p>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>{{ 'subscription.step3Title' | translate }}</h4>
                                <p>{{ 'subscription.step3Desc' | translate }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="popup-actions">
                        <!-- <p-button [label]="'MY_ACCESS.PAY_NOW' | translate" (click)="goToSubscription($event); subscriptionPopover.hide()" severity="primary" icon="pi pi-credit-card" /> -->
                        <p-button [label]="'common.buttons.close' | translate" (click)="subscriptionPopover.hide()" severity="secondary" variant="text" />
                    </div>
                </div>
            </div>
        </p-popover>
    `
})
export class AppTopbar {
    items!: MenuItem[];
    // Observable for remaining trial days for current user (null if none)
    trialDays$: Observable<number | null> = of(null);

    @ViewChild('subscriptionPopover') subscriptionPopover!: Popover;

    constructor(
        public layoutService: LayoutService,
        private authServ: AuthService,
        private router: Router
    ) {}

    ngOnInit() {
        this.trialDays$ = this.authServ.currentUser$.pipe(
            map((user) => {
                if (!user) return null;
                if (user.role !== 'specialist') return null;
                const normalize = (v: any): Date | null => {
                    if (!v) return null;
                    if (typeof v?.toDate === 'function') {
                        try {
                            return v.toDate();
                        } catch {
                            return null;
                        }
                    }
                    if (typeof v === 'number') return new Date(v);
                    if (typeof v === 'string') {
                        const d = new Date(v);
                        return isNaN(d.getTime()) ? null : d;
                    }
                    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
                    return null;
                };

                const gameExp = normalize((user as any).gameAccessExpires);
                const scaleExp = normalize((user as any).scaleAccessExpires);
                const now = new Date();
                const nearest = [gameExp, scaleExp].filter(Boolean).sort((a: any, b: any) => (a as Date).getTime() - (b as Date).getTime())[0] as Date | undefined;
                if (!nearest) return null;
                const diffMs = nearest.getTime() - now.getTime();
                if (diffMs <= 0) return null;
                return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            })
        );
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    // Navigate to subscription page; stop event propagation so parent popover isn't toggled
    goToSubscription(event: Event) {
        try {
            event.stopPropagation();
        } catch (e) {}
        this.router.navigate(['/app', 'subscription']);
    }

    async logout() {
        await this.authServ.logout();
    }
}
