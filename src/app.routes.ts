import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { ForgetPasswordComponent } from './app/pages/forget-password/forget-password.component';
import { ResetPasswordComponent } from './app/pages/reset-password/reset-password.component';
import { UserProfileComponent } from './app/pages/user-profile/user-profile.component';

export const appRoutes: Routes = [
    { path: 'forget-password', component: ForgetPasswordComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    {
        path: '',
        component: AppLayout,
        children: [{ path: 'user-profile', component: UserProfileComponent }]
    },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
