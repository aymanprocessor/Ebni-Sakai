import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../services/auth.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSelectorComponent } from '../../shared/components/language-selector/language-selector.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, TranslateModule, DividerModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, ReactiveFormsModule, RouterModule, RippleModule, CardModule, LanguageSelectorComponent],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class Login implements OnInit {
    loginForm: FormGroup = new FormGroup({});
    isLoading = false;
    constructor(
        private formBuilder: FormBuilder,
        private authServ: AuthService,
        private router: Router,
        private sweetlaert: SweetalertService
    ) {}

    ngOnInit(): void {
        // if (this.authServ.isLoggedIn()) {
        //     this.router.navigateByUrl('app/dashboard');
        // }
        this.loginForm = this.formBuilder.group({
            email: new FormControl(''),
            password: new FormControl(''),
            checked: new FormControl(false)
        });
    }

    async onLogin() {
        try {
            await this.authServ.login(this.loginForm.value.email, this.loginForm.value.password);
            this.router.navigateByUrl('app/dashboard');
        } catch (error) {
            console.error('Login error:', error);

            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseError = error as { code: string; message: string };

                switch (firebaseError.code) {
                    case 'auth/invalid-email':
                        this.sweetlaert.showToast('Invalid email format', 'error');
                        break;
                    case 'auth/user-disabled':
                        this.sweetlaert.showToast('This account has been disabled', 'error');
                        break;
                    case 'auth/user-not-found':
                        this.sweetlaert.showToast('No account found with this email', 'error');
                        break;
                    case 'auth/wrong-password':
                        this.sweetlaert.showToast('Incorrect password', 'error');
                        break;
                    case 'auth/too-many-requests':
                        this.sweetlaert.showToast('Too many failed login attempts. Try again later', 'error');
                        break;
                    default:
                        this.sweetlaert.showToast('Authentication failed: ' + firebaseError.message, 'error');
                }
            } else {
                this.sweetlaert.showToast('Login failed. Please try again', 'error');
            }
        }
    }

    async signInWithGoogle(): Promise<void> {
        this.isLoading = true;
        try {
            const user = await this.authServ.googleLogin();
            if (user) {
                // Wait for auth state to initialize and user profile to load
                await this.authServ.waitForInitialization();

                // Give a small delay to ensure currentUser$ is populated
                setTimeout(() => {
                    this.router.navigateByUrl('app/dashboard');
                }, 500);
            }
        } catch (error) {
            console.error('Google login failed', error);
            this.sweetlaert.showToast('Google login failed. Please try again.', 'error');
        } finally {
            this.isLoading = false;
        }
    }
}
