// src/app/layout/component/app.menu.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { Logger } from '../../services/logger.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(
        private translate: TranslateService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe((user) => {
            if (user) {
                Logger.log('User role:', user.role);
                switch (user.role) {
                    case 'admin':
                        this.loadAdminMenu();
                        break;
                    case 'specialist':
                        this.loadSpecialistMenu();
                        break;
                    case 'user':
                        this.loadUserMenu();
                        break;
                    default:
                        this.loadUserMenu();
                }
            }
        });
    }

    private loadUserMenu() {
        this.model = [
            {
                label: '',
                items: [
                    { label: 'navigation.dashboard', icon: 'pi pi-fw pi-home', routerLink: ['dashboard'] },
                    // { label: 'navigation.bookAppointment', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['booking'] },
                    { label: 'navigation.sessions', icon: 'pi pi-fw pi-calendar', routerLink: ['session'] },
                    //  { label: 'navigation.children', icon: 'pi pi-fw pi-users', routerLink: ['children'] },
                    //  { label: 'navigation.survey', icon: 'pi pi-fw pi-file', routerLink: ['survey'] },
                    { label: 'navigation.user-profile', icon: 'pi pi-fw pi-user', routerLink: ['user-profile'] },
                    { label: 'navigation.survey', icon: 'pi pi-fw pi-file', routerLink: ['mini-survey'] }
                ]
            }
        ];
    }

    private loadAdminMenu() {
        this.model = [
            {
                label: '',
                items: [
                    { label: 'navigation.dashboard', icon: 'pi pi-fw pi-home', routerLink: ['dashboard'] },
                    { label: 'navigation.users', icon: 'pi pi-fw pi-users', routerLink: ['user-management'] },
                    { label: 'navigation.timeSlots', icon: 'pi pi-fw pi-calendar', routerLink: ['booking/time-slots'] },
                    { label: 'navigation.appointments', icon: 'pi pi-fw pi-calendar-times', routerLink: ['booking/appointments'] },
                    { label: 'navigation.reports', icon: 'pi pi-fw pi-chart-bar', routerLink: ['reports'] },
                    { label: 'navigation.settings', icon: 'pi pi-fw pi-cog', routerLink: ['settings'] },
                    { label: 'navigation.user-profile', icon: 'pi pi-fw pi-user', routerLink: ['user-profile'] },
                    { label: 'navigation.survey', icon: 'pi pi-fw pi-file', routerLink: ['mini-survey'] }
                ]
            }
        ];
    }

    private loadSpecialistMenu() {
        this.model = [
            {
                label: '',
                items: [
                    { label: 'navigation.dashboard', icon: 'pi pi-fw pi-home', routerLink: ['dashboard'] },
                    { label: 'navigation.myAppointments', icon: 'pi pi-fw pi-calendar', routerLink: ['specialist-bookings'] },
                    //{ label: 'navigation.schedule', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['booking/appointments'] },
                    //{ label: 'navigation.reports', icon: 'pi pi-fw pi-chart-bar', routerLink: ['reports'] },
                    { label: 'navigation.user-profile', icon: 'pi pi-fw pi-user', routerLink: ['user-profile'] },
                    { label: 'navigation.survey', icon: 'pi pi-fw pi-file', routerLink: ['mini-survey'] }
                ]
            }
        ];
    }
}
