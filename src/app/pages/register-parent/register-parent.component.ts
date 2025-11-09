import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';
import { AuthService } from '../../services/auth.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { RegisterValidators, RegisterModel } from './register.model';

@Component({
    selector: 'app-register-parent',
    standalone: true,
    imports: [ButtonModule, CardModule, TranslateModule, DividerModule, InputTextModule, PasswordModule, FormsModule, ReactiveFormsModule, RouterModule, RippleModule, LanguageSelectorComponent],
    templateUrl: './register-parent.component.html',
    styleUrl: './register-parent.component.scss'
})
export class RegisterParentComponent implements OnInit {
    registerForm: FormGroup = new FormGroup({});
    isLoading = false;

    constructor(
        private formBuilder: FormBuilder,
        private authServ: AuthService,
        private router: Router,
        private sweetalert: SweetalertService
    ) {}

    ngOnInit(): void {
        this.registerForm = this.formBuilder.group(
            {
                firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
                lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required]],
                confirmPassword: ['', [Validators.required]]
            },
            {
                validators: RegisterValidators.passwordMatch()
            }
        );
    }

    async onRegister() {
        if (this.registerForm.valid) {
            try {
                const registerData: RegisterModel = {
                    ...this.registerForm.value,
                    role: 'specialist'
                };
                await this.authServ.register(registerData);
                this.sweetalert.showToast('Registration successful', 'success');
                this.router.navigateByUrl('app/dashboard');
            } catch (error: any) {
                console.error('Registration error:', error);
                this.sweetalert.showToast(error.message || 'Registration failed', 'error');
            }
        } else {
            this.sweetalert.showToast('Please fill all required fields correctly', 'error');
        }
    }

    async signInWithGoogle(): Promise<void> {
        this.isLoading = true;
        try {
            const user = await this.authServ.googleLogin();
            if (user) {
                await this.authServ.waitForInitialization();
                // small delay to ensure profile is loaded
                setTimeout(() => {
                    this.router.navigateByUrl('app/dashboard');
                }, 500);
            }
        } catch (error) {
            console.error('Google signup failed', error);
            this.sweetalert.showToast('Google signup failed. Please try again.', 'error');
        } finally {
            this.isLoading = false;
        }
    }
}
