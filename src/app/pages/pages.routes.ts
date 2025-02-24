import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';

export default [
    {path:'user-profile',component:UserProfileComponent},
    { path: '**', redirectTo: '/notfound' }
] as Routes;
