// src/app/pages/auth/login.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Login } from './login';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../services/auth.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let authServiceSpy: jasmine.SpyObj<AuthService>;
    let sweetalertServiceSpy: jasmine.SpyObj<SweetalertService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;

    beforeEach(async () => {
        // Create spies
        authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'googleLogin']);
        sweetalertServiceSpy = jasmine.createSpyObj('SweetalertService', ['showToast']);
        routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
        translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant', 'get']);

        // Configure translate service mock
        translateServiceSpy.instant.and.callFake((key: string) => key);
        translateServiceSpy.get.and.returnValue(of(''));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RouterTestingModule, TranslateModule.forRoot(), ButtonModule, CheckboxModule, InputTextModule, PasswordModule, DividerModule, Login],
            providers: [
                { provide: AuthService, useValue: authServiceSpy },
                { provide: SweetalertService, useValue: sweetalertServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: TranslateService, useValue: translateServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Form Initialization', () => {
        it('should initialize the login form with empty fields', () => {
            expect(component.loginForm).toBeDefined();
            expect(component.loginForm.get('email')?.value).toBe('');
            expect(component.loginForm.get('password')?.value).toBe('');
            expect(component.loginForm.get('checked')?.value).toBe(false);
        });

        it('should have required validators on email and password', () => {
            const emailControl = component.loginForm.get('email');
            const passwordControl = component.loginForm.get('password');

            emailControl?.setValue('');
            passwordControl?.setValue('');

            expect(emailControl?.valid).toBeFalsy();
            expect(passwordControl?.valid).toBeFalsy();
        });
    });

    describe('Login Functionality', () => {
        it('should call authService.login with form values on successful form submission', async () => {
            const mockEmail = 'test@example.com';
            const mockPassword = 'password123';

            component.loginForm.setValue({
                email: mockEmail,
                password: mockPassword,
                checked: false
            });

            authServiceSpy.login.and.returnValue(Promise.resolve());

            await component.onLogin();

            expect(authServiceSpy.login).toHaveBeenCalledWith(mockEmail, mockPassword);
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('app/dashboard');
        });

        it('should handle login errors and show appropriate error messages', fakeAsync(() => {
            const mockEmail = 'test@example.com';
            const mockPassword = 'wrongpassword';

            component.loginForm.setValue({
                email: mockEmail,
                password: mockPassword,
                checked: false
            });

            const errorCases = [
                { code: 'auth/invalid-email', expectedMessage: 'Invalid email format' },
                { code: 'auth/user-disabled', expectedMessage: 'This account has been disabled' },
                { code: 'auth/user-not-found', expectedMessage: 'No account found with this email' },
                { code: 'auth/wrong-password', expectedMessage: 'Incorrect password' },
                { code: 'auth/too-many-requests', expectedMessage: 'Too many failed login attempts. Try again later' }
            ];

            errorCases.forEach(async (errorCase) => {
                authServiceSpy.login.and.returnValue(Promise.reject({ code: errorCase.code }));

                await component.onLogin();
                tick();

                expect(sweetalertServiceSpy.showToast).toHaveBeenCalledWith(errorCase.expectedMessage, 'error');
            });
        }));

        it('should handle unknown errors during login', async () => {
            component.loginForm.setValue({
                email: 'test@example.com',
                password: 'password123',
                checked: false
            });

            authServiceSpy.login.and.returnValue(Promise.reject(new Error('Unknown error')));

            await component.onLogin();

            expect(sweetalertServiceSpy.showToast).toHaveBeenCalledWith('Authentication failed: Unknown error', 'error');
        });
    });

    describe('Google Login', () => {
        it('should set loading state and call authService.googleLogin when signing in with Google', async () => {
            const mockUser = { uid: '123', email: 'test@gmail.com' };
            authServiceSpy.googleLogin.and.returnValue(Promise.resolve(mockUser as any));

            await component.signInWithGoogle();

            expect(component.isLoading).toBeFalse();
            expect(authServiceSpy.googleLogin).toHaveBeenCalled();
            expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('app/dashboard');
        });

        it('should handle Google login errors', async () => {
            authServiceSpy.googleLogin.and.returnValue(Promise.reject(new Error('Google login failed')));

            await component.signInWithGoogle();

            expect(component.isLoading).toBeFalse();
            // Note: The component doesn't show error toast for Google login failures
        });

        it('should toggle loading state correctly during Google login', async () => {
            authServiceSpy.googleLogin.and.returnValue(new Promise((resolve) => setTimeout(resolve, 100)));

            const loginPromise = component.signInWithGoogle();
            expect(component.isLoading).toBeTrue();

            await loginPromise;
            expect(component.isLoading).toBeFalse();
        });
    });

    describe('Form Validation', () => {
        it('should not call login service if form is invalid', async () => {
            component.loginForm.setValue({
                email: '',
                password: '',
                checked: false
            });

            await component.onLogin();

            expect(authServiceSpy.login).not.toHaveBeenCalled();
        });

        it('should validate email format', () => {
            const emailControl = component.loginForm.get('email');

            emailControl?.setValue('invalid-email');
            expect(emailControl?.valid).toBeFalsy();

            emailControl?.setValue('valid@email.com');
            expect(emailControl?.valid).toBeTruthy();
        });
    });

    describe('UI Interaction', () => {
        it('should render email and password inputs', () => {
            const compiled = fixture.nativeElement;
            const emailInput = compiled.querySelector('#email1');
            const passwordInput = compiled.querySelector('#password1');

            expect(emailInput).toBeTruthy();
            expect(passwordInput).toBeTruthy();
        });

        it('should render login and Google login buttons', () => {
            const compiled = fixture.nativeElement;
            const buttons = compiled.querySelectorAll('p-button');

            expect(buttons.length).toBe(2);
            // Login button and Google login button should be present
        });

        it('should have a link to register page', () => {
            const compiled = fixture.nativeElement;
            const registerLink = compiled.querySelector('a[routerLink="/auth/register"]');

            expect(registerLink).toBeTruthy();
        });
    });

    describe('Error Messages', () => {
        it('should display appropriate error message for different auth errors', async () => {
            const authErrors = [
                { code: 'auth/invalid-email', message: 'Invalid email format' },
                { code: 'auth/user-disabled', message: 'This account has been disabled' },
                { code: 'auth/user-not-found', message: 'No account found with this email' },
                { code: 'auth/wrong-password', message: 'Incorrect password' },
                { code: 'auth/too-many-requests', message: 'Too many failed login attempts. Try again later' }
            ];

            for (const error of authErrors) {
                component.loginForm.setValue({
                    email: 'test@example.com',
                    password: 'password123',
                    checked: false
                });

                authServiceSpy.login.and.returnValue(Promise.reject({ code: error.code }));

                await component.onLogin();

                expect(sweetalertServiceSpy.showToast).toHaveBeenCalledWith(error.message, 'error');
                sweetalertServiceSpy.showToast.calls.reset();
            }
        });
    });
});
