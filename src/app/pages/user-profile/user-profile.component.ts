import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-user-profile',
    imports: [NgIf, InputTextModule, ButtonModule, InputMaskModule, ReactiveFormsModule],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent {
    profileForm: FormGroup = new FormGroup({});
    avatarUrl: string = 'assets/images/default-avatar.png'; // Default avatar

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.profileForm = this.fb.group({
            displayName: ['', Validators.required],
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
            email: ['', [Validators.required, Validators.email]]
        });
    }

    onSubmit() {
        if (this.profileForm.valid) {
            console.log(this.profileForm.value);
            // Handle form submission
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
