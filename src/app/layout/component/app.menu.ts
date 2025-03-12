import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { TranslateService } from '@ngx-translate/core';

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
export class AppMenu {
    model: MenuItem[] = [];
    constructor(private translate: TranslateService) {}
    ngOnInit() {
        this.model = [
            {
                label: '',
                items: [
                    { label: 'navigation.dashboard', icon: 'pi pi-fw pi-home', routerLink: ['dashboard'] },
                    { label: 'navigation.children', icon: 'pi pi-fw pi-home', routerLink: ['children'] },
                    { label: 'navigation.survey', icon: 'pi pi-fw pi-file', routerLink: ['survey'] },
                    { label: 'navigation.user-profile', icon: 'pi pi-fw pi-user', routerLink: ['user-profile'] }
                ]
            }
        ];
    }
}
