import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Access } from './app/pages/auth/access';
import { Login } from './app/pages/auth/login';
import { authGuard } from './app/auth.guard';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { UserProfileComponent } from './app/pages/user-profile/user-profile.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'user-profile', component: UserProfileComponent, canActivate: [authGuard] }
        ]
    },

    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/notfound' }
];
