import { Routes } from '@angular/router';
import { authGuard } from './app/guards/auth.guard';
import { redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { RedirectLoggedInGuard } from './app/guards/login.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { SpecialistGuard } from './app/guards/specialist.guard';
import { AdminGuard } from './app/guards/admin.guard';
import { GamePermissionGuard, ScalePermissionGuard } from './app/guards/permission.guard';
import { GamesListGuard } from './app/guards/games-list.guard';
import { ScalesListGuard } from './app/guards/scales-list.guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth/login']);
const redirectLoggedInToDashboard = () => redirectLoggedInTo(['app/dashboard']);
export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./app/pages/home/home.component').then((m) => m.HomeComponent)
    },
    {
        path: 'about-us',
        loadComponent: () => import('./app/pages/about-us/about-us.component').then((m) => m.AboutUsComponent)
    },

    {
        path: 'client-profile-form',
        loadComponent: () => import('./app/pages/client-profile-form/client-profile-form.component').then((m) => m.ClientProfileFormComponent)
    },
    {
        path: 'error',
        loadComponent: () => import('./app/pages/error-page/error-page.component').then((m) => m.ErrorPageComponent)
    },
    {
        path: 'chatgpt-assistance',
        loadComponent: () => import('./app/pages/chatgpt-assistance/chatgpt-assistance.component').then((m) => m.ChatgptAssistanceComponent)
    },

    // NOTE: scales routes were moved under '/app' children so they are
    // available at '/app/scales' and '/app/scales/{id}'. The previous top-level
    // '/scales' path has been removed.
    // NOTE: individual game routes have been moved under the '/app' parent so
    // routes are available at '/app/game' and '/app/game/{id}'. The previous
    // top-level '/game' path has been removed to avoid duplicate/conflicting
    // routes.
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
                path: 'selection',
                loadComponent: () => import('./app/pages/selection-page/selection-page.component').then((m) => m.SelectionPageComponent),
                canActivate: [authGuard]
            },
            {
                // Games parent route. Default child ('') shows the games list at
                // '/app/game'. Individual games are available at '/app/game/{id}'.
                path: 'game',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./app/pages/games-list/games-list.component').then((m) => m.GamesListComponent),
                        canActivate: [authGuard]
                    },
                    {
                        path: '1',
                        loadComponent: () => import('./app/pages/games/c1/c1.component').then((m) => m.C1Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '2',
                        loadComponent: () => import('./app/pages/games/c2/c2.component').then((m) => m.C2Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '3',
                        loadComponent: () => import('./app/pages/games/c3/c3.component').then((m) => m.C3Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '4',
                        loadComponent: () => import('./app/pages/games/c4/c4.component').then((m) => m.C4Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '5',
                        loadComponent: () => import('./app/pages/games/c5/c5.component').then((m) => m.C5Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '6',
                        loadComponent: () => import('./app/pages/games/c6/c6.component').then((m) => m.C6Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '7',
                        loadComponent: () => import('./app/pages/games/c7/c7.component').then((m) => m.C7Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '8',
                        loadComponent: () => import('./app/pages/games/c8/c8.component').then((m) => m.C8Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '9',
                        loadComponent: () => import('./app/pages/games/c9/c9.component').then((m) => m.C9Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '10',
                        loadComponent: () => import('./app/pages/games/c10/c10.component').then((m) => m.C10Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '11',
                        loadComponent: () => import('./app/pages/games/c11/c11.component').then((m) => m.C11Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '12',
                        loadComponent: () => import('./app/pages/games/c12/c12.component').then((m) => m.C12Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '13',
                        loadComponent: () => import('./app/pages/games/c13/c13.component').then((m) => m.C13Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '14',
                        loadComponent: () => import('./app/pages/games/c14/c14.component').then((m) => m.C14Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '15',
                        loadComponent: () => import('./app/pages/games/c15/c15.component').then((m) => m.C15Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '16',
                        loadComponent: () => import('./app/pages/games/c16/c16.component').then((m) => m.C16Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '17',
                        loadComponent: () => import('./app/pages/games/c17/c17.component').then((m) => m.C17Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '18',
                        loadComponent: () => import('./app/pages/games/c18/c18.component').then((m) => m.C18Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '19',
                        loadComponent: () => import('./app/pages/games/c19/c19.component').then((m) => m.C19Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '20',
                        loadComponent: () => import('./app/pages/games/c20/c20.component').then((m) => m.C20Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '21',
                        loadComponent: () => import('./app/pages/games/c21/c21.component').then((m) => m.C21Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '22',
                        loadComponent: () => import('./app/pages/games/c22/c22.component').then((m) => m.C22Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '23',
                        loadComponent: () => import('./app/pages/games/c23/c23.component').then((m) => m.C23Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '24',
                        loadComponent: () => import('./app/pages/games/c24/c24.component').then((m) => m.C24Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '25',
                        loadComponent: () => import('./app/pages/games/c25/c25.component').then((m) => m.C25Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '26',
                        loadComponent: () => import('./app/pages/games/c26/c26.component').then((m) => m.C26Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '27',
                        loadComponent: () => import('./app/pages/games/c27/c27.component').then((m) => m.C27Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '28',
                        loadComponent: () => import('./app/pages/games/c28/c28.component').then((m) => m.C28Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '29',
                        loadComponent: () => import('./app/pages/games/c29/c29.component').then((m) => m.C29Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '30',
                        loadComponent: () => import('./app/pages/games/c30/c30.component').then((m) => m.C30Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '31',
                        loadComponent: () => import('./app/pages/games/c31/c31.component').then((m) => m.C31Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '32',
                        loadComponent: () => import('./app/pages/games/c32/c32.component').then((m) => m.C32Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '33',
                        loadComponent: () => import('./app/pages/games/c33/c33.component').then((m) => m.C33Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '34',
                        loadComponent: () => import('./app/pages/games/c34/c34.component').then((m) => m.C34Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '35',
                        loadComponent: () => import('./app/pages/games/c35/c35.component').then((m) => m.C35Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '36',
                        loadComponent: () => import('./app/pages/games/c36/c36.component').then((m) => m.C36Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '37',
                        loadComponent: () => import('./app/pages/games/c37/c37.component').then((m) => m.C37Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '38',
                        loadComponent: () => import('./app/pages/games/c38/c38.component').then((m) => m.C38Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '39',
                        loadComponent: () => import('./app/pages/games/c39/c39.component').then((m) => m.C39Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '40',
                        loadComponent: () => import('./app/pages/games/c40/c40.component').then((m) => m.C40Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '41',
                        loadComponent: () => import('./app/pages/games/c41/c41.component').then((m) => m.C41Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '42',
                        loadComponent: () => import('./app/pages/games/c42/c42.component').then((m) => m.C42Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '43',
                        loadComponent: () => import('./app/pages/games/c43/c43.component').then((m) => m.C43Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '44',
                        loadComponent: () => import('./app/pages/games/c44/c44.component').then((m) => m.C44Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '45',
                        loadComponent: () => import('./app/pages/games/c45/c45.component').then((m) => m.C45Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '46',
                        loadComponent: () => import('./app/pages/games/c46/c46.component').then((m) => m.C46Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '47',
                        loadComponent: () => import('./app/pages/games/c47/c47.component').then((m) => m.C47Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '48',
                        loadComponent: () => import('./app/pages/games/c48/c48.component').then((m) => m.C48Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '49',
                        loadComponent: () => import('./app/pages/games/c49/c49.component').then((m) => m.C49Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '50',
                        loadComponent: () => import('./app/pages/games/c50/c50.component').then((m) => m.C50Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '51',
                        loadComponent: () => import('./app/pages/games/c51/c51.component').then((m) => m.C51Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    },
                    {
                        path: '52',
                        loadComponent: () => import('./app/pages/games/c52/c52.component').then((m) => m.C52Component),
                        canActivate: [authGuard, GamePermissionGuard]
                    }
                ]
            },
            {
                // Scales parent route moved under '/app' so the list is at
                // '/app/scales' and individual scales at '/app/scales/{id}'.
                path: 'scales',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./app/pages/scales/scales-list/scales-list.component').then((m) => m.ScalesListComponent),
                        canActivate: [authGuard]
                    },
                    {
                        path: '1',
                        loadComponent: () => import('./app/pages/scales/s1/s1.component').then((m) => m.S1Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '2',
                        loadComponent: () => import('./app/pages/scales/s2/s2.component').then((m) => m.S2Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '3',
                        loadComponent: () => import('./app/pages/scales/s3/s3.component').then((m) => m.S3Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '4',
                        loadComponent: () => import('./app/pages/scales/s4/s4.component').then((m) => m.S4Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '5',
                        loadComponent: () => import('./app/pages/scales/s5/s5.component').then((m) => m.S5Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '6',
                        loadComponent: () => import('./app/pages/scales/s6/s6.component').then((m) => m.S6Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    },
                    {
                        path: '7',
                        loadComponent: () => import('./app/pages/scales/s7/s7.component').then((m) => m.S7Component),
                        canActivate: [authGuard, ScalePermissionGuard]
                    }
                ]
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
                path: 'specialist-bookings',
                loadComponent: () => import('./app/pages/specialist-bookings/specialist-bookings.component').then((m) => m.SpecialistBookingsComponent),
                canActivate: [authGuard, SpecialistGuard]
            },
            {
                path: 'user-management',
                loadComponent: () => import('./app/pages/user-management/user-management.component').then((m) => m.UserManagementComponent),
                canActivate: [authGuard, AdminGuard]
            },
            {
                path: 'permissions-management',
                loadComponent: () => import('./app/pages/permissions-management/permissions-management.component').then((m) => m.PermissionsManagementComponent),
                canActivate: [authGuard, AdminGuard]
            },
            {
                path: 'user-permissions',
                loadComponent: () => import('./app/pages/user-permissions/user-permissions.component').then((m) => m.UserPermissionsComponent),
                canActivate: [authGuard, AdminGuard]
            },
            {
                path: 'my-access',
                loadComponent: () => import('./app/pages/my-access/my-access.component').then((m) => m.MyAccessComponent),
                canActivate: [authGuard]
            },

            {
                path: 'zoom-meeting/:id',
                loadComponent: () => import('./app/pages/zoom-meetings/zoom-meetings.component').then((m) => m.ZoomMeetingComponent)
            },
            {
                path: 'mini-survey',
                loadComponent: () => import('./app/pages/mini-survey/mini-survey-form/mini-survey-form.component').then((m) => m.MiniSurveyFormComponent)
            },
            {
                path: 'mini-survey/:id',
                loadComponent: () => import('./app/pages/mini-survey/mini-survey-qurstions/mini-survey-qurstions.component').then((m) => m.MiniSurveyQurstionsComponent)
            },
            {
                path: 'complete-survey',
                loadComponent: () => import('./app/pages/complete-page/complete-page.component').then((m) => m.CompletePageComponent)
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
            /* privacy-policy and terms-of-use moved out to top-level so they use the public/landing layout */

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
        path: 'privacy-policy',
        loadComponent: () => import('./app/pages/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent)
    },
    {
        path: 'terms-of-use',
        loadComponent: () => import('./app/pages/terms-of-use/terms-of-use.component').then((m) => m.TermsOfUseComponent)
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
