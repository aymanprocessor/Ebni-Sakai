import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';

// PrimeNG Modules
import { MenubarModule } from 'primeng/menubar';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { FluidModule } from 'primeng/fluid';

@Component({
    selector: 'app-mini-survey-form',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        CommonModule,
        // PrimeNG Modules
        MenubarModule,
        CardModule,
        InputTextModule,
        CalendarModule,
        RadioButtonModule,
        ButtonModule,
        ToastModule,
        DatePickerModule,
        FluidModule
    ],
    templateUrl: './mini-survey-form.component.html',
    styleUrl: './mini-survey-form.component.scss'
})
export class MiniSurveyFormComponent implements OnInit, OnDestroy {
    registrationForm: FormGroup;
    hasDisabilty: boolean = false;
    isSubmitting: boolean = false;
    isDarkMode: boolean = false;
    isHighContrast: boolean = false;

    private webhookUrl = 'https://n8n.kidskills.app/webhook/8c0717cb-dfeb-4fc5-9069-d8d0462f122f';

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private http: HttpClient,
        private router: Router,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.registrationForm = this.fb.group({
            childName: ['', [Validators.required, Validators.minLength(2)]],
            childBirthday: ['', Validators.required],
            hasDisability: [null, Validators.required],
            parentName: ['', [Validators.required, Validators.minLength(2)]],
            parentEmail: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnInit(): void {
        // Load saved theme preferences
        this.loadThemePreferences();
        this.applyThemeToDocument();
    }

    ngOnDestroy(): void {
        // Clean up theme classes when component is destroyed
        this.removeThemeClasses();
    }

    private loadThemePreferences(): void {
        // Load from localStorage if available
        if (typeof Storage !== 'undefined') {
            const savedDarkMode = localStorage.getItem('darkMode');
            const savedHighContrast = localStorage.getItem('highContrast');

            this.isDarkMode = savedDarkMode === 'true';
            this.isHighContrast = savedHighContrast === 'true';

            // Ensure only one mode is active
            if (this.isHighContrast) {
                this.isDarkMode = false;
            }
        }
    }

    private saveThemePreferences(): void {
        // Save to localStorage if available
        if (typeof Storage !== 'undefined') {
            localStorage.setItem('darkMode', this.isDarkMode.toString());
            localStorage.setItem('highContrast', this.isHighContrast.toString());
        }
    }

    private applyThemeToDocument(): void {
        // Remove existing theme classes
        this.removeThemeClasses();

        // Apply appropriate theme class to body and set data attribute
        if (this.isHighContrast) {
            this.renderer.addClass(this.document.body, 'high-contrast-mode');
            this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'high-contrast');
        } else if (this.isDarkMode) {
            this.renderer.addClass(this.document.body, 'dark-mode');
            this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'dark');
        } else {
            this.renderer.addClass(this.document.body, 'light-mode');
            this.renderer.setAttribute(this.document.documentElement, 'data-theme', 'light');
        }
    }

    private removeThemeClasses(): void {
        this.renderer.removeClass(this.document.body, 'dark-mode');
        this.renderer.removeClass(this.document.body, 'light-mode');
        this.renderer.removeClass(this.document.body, 'high-contrast-mode');
        this.renderer.removeAttribute(this.document.documentElement, 'data-theme');
    }

    toggleDarkMode(): void {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            this.isHighContrast = false;
        }
        this.applyThemeToDocument();
        this.saveThemePreferences();
    }

    toggleHighContrast(): void {
        this.isHighContrast = !this.isHighContrast;
        if (this.isHighContrast) {
            this.isDarkMode = false;
        }
        this.applyThemeToDocument();
        this.saveThemePreferences();
    }

    onSubmit(): void {
        if (this.registrationForm.valid) {
            this.submitToWebhook();
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'خطأ في النموذج',
                detail: 'يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح'
            });
        }
    }

    private submitToWebhook(): void {
        this.isSubmitting = true;

        const formData = {
            childName: this.registrationForm.get('childName')?.value,
            childBirthday: this.registrationForm.get('childBirthday')?.value,
            hasDisability: this.registrationForm.get('hasDisability')?.value,
            parentName: this.registrationForm.get('parentName')?.value,
            parentEmail: this.registrationForm.get('parentEmail')?.value,
            submittedAt: new Date().toISOString()
        };

        this.http.post(this.webhookUrl, formData).subscribe({
            next: (response: any) => {
                this.isSubmitting = false;
                if (response.success) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'تم الإرسال بنجاح',
                        detail: 'تم تسجيل بيانات الطفل بنجاح. سيتم التواصل معك قريباً.'
                    });
                    this.registrationForm.reset();
                    this.router.navigateByUrl('app/mini-survey/' + response.id);
                }
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Webhook submission error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ في الإرسال',
                    detail: 'حدث خطأ أثناء إرسال البيانات. يرجى المحاولة مرة أخرى.'
                });
            }
        });
    }

    // Getter methods for form validation
    get childName() {
        return this.registrationForm.get('childName');
    }

    get childBirthday() {
        return this.registrationForm.get('childBirthday');
    }

    get parentName() {
        return this.registrationForm.get('parentName');
    }

    get parentEmail() {
        return this.registrationForm.get('parentEmail');
    }

    getCalendarInputClass(): string {
        const baseClasses = 'mt-1 block w-full px-3 py-2 border rounded-md text-sm text-right transition-colors duration-200';

        if (this.isHighContrast) {
            return `${baseClasses} bg-black border-white text-white focus:border-yellow-400 focus:ring-yellow-400`;
        } else if (this.isDarkMode) {
            return `${baseClasses} bg-gray-700 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400`;
        }
        return `${baseClasses} bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500`;
    }
}
