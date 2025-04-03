import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { AuthService } from '../../services/auth.service';

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
                        <button type="button" (click)="op.toggle($event)" class="layout-topbar-action">
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
    `
})
export class AppTopbar {
    items!: MenuItem[];

    constructor(
        public layoutService: LayoutService,
        private authServ: AuthService
    ) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    async logout() {
        await this.authServ.logout();
    }
}
