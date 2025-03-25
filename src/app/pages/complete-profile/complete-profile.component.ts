import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { take } from 'rxjs';

@Component({
    selector: 'app-complete-profile',
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, CardModule, InputTextModule, AvatarModule],
    templateUrl: './complete-profile.component.html',
    styleUrl: './complete-profile.component.scss'
})
export class CompleteProfileComponent implements OnInit {
    profileForm: FormGroup;
    profile: UserProfile | null = null;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.profileForm = this.fb.group({
            firstName: ['', [Validators.required]],
            lastName: ['', [Validators.required]],
            email: [{ value: '', disabled: true }],
            uid: ['']
        });
    }

    ngOnInit(): void {
        // Get user profile data
        // this.authService.userProfile$.pipe(take(1)).subscribe((profile) => {
        //     if (profile) {
        //         this.profile = profile;
        //         this.profileForm.patchValue({
        //             firstName: profile.firstName,
        //             lastName: profile.lastName,
        //             email: profile.email,
        //             uid: profile.uid
        //         });
        //     }
        // });
    }

    isFieldInvalid(field: string): boolean {
        const control = this.profileForm.get(field);
        return !!(control && control.invalid && (control.dirty || control.touched));
    }

    async onSubmit(): Promise<void> {
        if (this.profileForm.invalid) return;

        this.isSubmitting = true;

        try {
            const formValue = this.profileForm.getRawValue();
            await this.authService.updateUserProfile(formValue.uid, {
                firstName: formValue.firstName,
                lastName: formValue.lastName,
                isNewUser: false
            });

            this.router.navigate(['/dashboard']);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            this.isSubmitting = false;
        }
    }
}
