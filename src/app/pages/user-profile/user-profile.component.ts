import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { ReactiveFormsModule } from '@angular/forms';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-user-profile',
    imports: [NgIf, InputTextModule, ButtonModule, InputMaskModule, ReactiveFormsModule, TranslateModule],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
    profileForm: FormGroup = new FormGroup({});

    avatarUrl: string = 'assets/images/default-avatar.png'; // Default avatar
    private userSub: Subscription | null = null;

    constructor(
        private fb: FormBuilder,
        private userProfileServ: UserProfileService,
        private authServ: AuthService
    ) {
        this.profileForm = this.fb.group({
            //displayName: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            mobile: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
            email: [{ value: '', disabled: true }, [Validators.required, Validators.email]]
        });
    }

    ngOnInit() {
        this.userSub = this.authServ.currentUser$.subscribe((user) => {
            if (user) {
                this.loadUserProfile(user.uid);
            }
        });
    }
    private async loadUserProfile(uid: string): Promise<void> {
        try {
            // console.log('USER ', this.authServ.getCurrentUser());
            const profile = await this.userProfileServ.getUserProfile(uid);
            if (profile) {
                this.profileForm.patchValue(profile);
                this.avatarUrl = profile.photoURL || 'assets/images/default-avatar.png';
            }
        } catch (err) {
            console.error(err);
        }
    }
    async onSubmit() {
        if (this.profileForm.valid) {
            try {
                console.log(this.profileForm.value);
                await this.userProfileServ.updateUserProfile(this.profileForm.value);
            } catch (error) {
                console.log(error);
            }
        }
    }

    onFileSelect(event: any) {
        if (event.target.files.length > 0) {
            const file = event.target.files[0];
            // Handle file upload

            // For preview
            const reader = new FileReader();
            reader.onload = () => {
                this.avatarUrl = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }
}
