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
                path: 'booking',
                loadComponent: () => import('./app/pages/booking/booking-calendar/booking-calendar.component').then((m) => m.BookingCalendarComponent),
                canActivate: [authGuard]
            },
            {
                path: 'time-slots',
                loadComponent: () => import('./app/pages/booking/time-slots/time-slots.component').then((m) => m.AdminTimeSlotsComponent),
                canActivate: [authGuard]
            },
            {
                path: 'time-slots-by-date',
                loadComponent: () => import('./app/pages/booking/time-slots-by-date/time-slots-by-date.component').then((m) => m.TimeSlotsByDateComponent),
                canActivate: [authGuard]
            },
            {
                path: 'time-slots-calendar',
                loadComponent: () => import('./app/pages/booking/time-slots-calendar/time-slots-calendar.component').then((m) => m.TimeSlotsCalendarComponent),
                canActivate: [authGuard]
            },
            {
                path: 'appointment-scheduler',
                loadComponent: () => import('./app/pages/booking/appointment-scheduler/appointment-scheduler.component').then((m) => m.AppointmentSchedulerComponent),
                canActivate: [authGuard]
            },
            {
                path: 'session',
                loadComponent: () => import('./app/pages/session/session-booking/session-booking.component').then((m) => m.SessionBookingComponent),
                canActivate: [authGuard]
            },
            {
                path: 'survey',
                children: [
                    {
                        path: 'list',
                        loadComponent: () => import('./app/pages/survey/survey-list/survey-list.component').then((m) => m.SurveyListComponent),
                        canActivate: [authGuard]
                    },
                    {
                        path: 'question/:id',
                        loadComponent: () => import('./app/pages/survey/survey-question/survey-question.component').then((m) => m.SurveyQuestionComponent),
                        canActivate: [authGuard]
                    },
                    // {
                    //     path: 'result',
                    //     loadComponent: () => import('./app/pages/survey/survey-result/survey-result.component').then((m) => m.SurveyResultComponent),
                    //     canActivate: [authGuard]
                    // },
                    {
                        path: '',
                        redirectTo: 'list',
                        pathMatch: 'full'
                    }
                ]
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
