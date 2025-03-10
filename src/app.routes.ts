import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { ForgetPasswordComponent } from './app/pages/forget-password/forget-password.component';
import { ResetPasswordComponent } from './app/pages/reset-password/reset-password.component';
import { Access } from './app/pages/auth/access';
import { Login } from './app/pages/auth/login';
import { authGuard } from './app/guards/auth.guard';
import { DashboardComponent } from './app/pages/dashboard/dashboard.component';
import { UserProfileComponent } from './app/pages/user-profile/user-profile.component';
import { CompleteProfileComponent } from './app/pages/complete-profile/complete-profile.component';
import { LocationStrategy } from '@angular/common';
import { LoginGuard } from './app/guards/login.guard';
import { RegisterParentComponent } from './app/pages/register-parent/register-parent.component';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/forget-password', component: ForgetPasswordComponent },
    { path: 'auth/reset-password', component: ResetPasswordComponent },
    { path: 'auth/complete-profile', component: CompleteProfileComponent, canActivate: [authGuard] },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: DashboardComponent },
            { path: 'user-profile', component: UserProfileComponent }
        ]
    },
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'auth/login', component: Login, canActivate: [LoginGuard] },
    { path: 'auth/register', component: RegisterParentComponent, canActivate: [LoginGuard] },   
    { path: '**', redirectTo: '/notfound' }
];
