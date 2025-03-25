import { Routes } from '@angular/router';
import { authGuard } from './app/guards/auth.guard';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { RedirectLoggedInGuard } from './app/guards/login.guard';
import { AppLayout } from './app/layout/component/app.layout';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['app/dashboard']);
export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    {
        path: 'app',
        component: AppLayout,
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./app/pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
                canActivate: [authGuard]
            },
            {
                path: 'children',
                loadComponent: () => import('./app/pages/children/children.component').then((m) => m.ChildrenComponent),
                canActivate: [authGuard]
            },
            {
                path: 'survey',
                loadComponent: () => import('./app/pages/survey/survey.component').then((m) => m.SurveyComponent),
                canActivate: [authGuard]
            },
            {
                path: 'user-profile',
                loadComponent: () => import('./app/pages/user-profile/user-profile.component').then((m) => m.UserProfileComponent),
                canActivate: [authGuard]
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: '**',
                redirectTo: 'error',
                pathMatch: 'full'
            }
        ]
    },

    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () => import('./app/pages/auth/login').then((m) => m.Login),
                canActivate: [RedirectLoggedInGuard]
            },
            {
                path: 'register',
                loadComponent: () => import('./app/pages/register-parent/register-parent.component').then((m) => m.RegisterParentComponent),
                canActivate: [RedirectLoggedInGuard]
            }
        ]
    },

    {
        path: 'complete-profile',
        loadComponent: () => import('./app/pages/complete-profile/complete-profile.component').then((m) => m.CompleteProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: 'error',
        loadComponent: () => import('./app/pages/auth/error').then((m) => m.Error)
    }
];
