import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../../services/auth.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { DividerModule } from 'primeng/divider';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, TranslateModule, DividerModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, ReactiveFormsModule, RouterModule, RippleModule, AppFloatingConfigurator],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="assets/images/Logo 2.png" style="width:200px" alt="Logo" class="text-center" />

                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ 'pages.login.welcome' | translate }}</div>
                        </div>

                        <form [formGroup]="loginForm">
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">{{ 'common.labels.email' | translate }}</label>
                            <input pInputText id="email1" formControlName="email" type="text" class="w-full md:w-[30rem] mb-8" />

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">{{ 'common.labels.password' | translate }}</label>
                            <p-password id="password1" formControlName="password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <div class="flex items-center">
                                    <p-checkbox formControlName="checked" id="rememberme1" binary class="me-2"></p-checkbox>
                                    <label for="rememberme1">{{ 'common.labels.rememberMe' | translate }}</label>
                                </div>
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">{{ 'common.labels.forgotPassword' | translate }}</span>
                            </div>
                            <p-button label="{{ 'common.buttons.login' | translate }}" (onClick)="onLogin()" styleClass="w-full" routerLink="/"></p-button>

                            <div class="text-center mt-4">
                                <span class="text-surface-900 dark:text-surface-0">{{ 'common.labels.createAnAccount' | translate }}</span>
                                <a class="font-medium no-underline ml-2 text-primary cursor-pointer" [routerLink]="['/auth/register']">{{ 'common.buttons.register' | translate }}</a>
                            </div>
                            <p-divider align="center" type="solid"
                                ><b>{{ 'common.labels.or' | translate }}</b></p-divider
                            >
                            <p-button label="{{ 'common.buttons.loginWithGoogle' | translate }}" icon="pi pi-google" styleClass="w-full" [loading]="isLoading" (onClick)="signInWithGoogle()"> </p-button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
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
            const res = await this.authServ.googleLogin();
            this.router.navigateByUrl('app/dashboard');
            console.log(res);
            // No need to navigate, the auth service handles redirection
        } catch (error) {
            // this.sweetlaert.showToast(error + '', 'error');
            console.error('Login failed', error);
        } finally {
            this.isLoading = false;
        }
    }
}
