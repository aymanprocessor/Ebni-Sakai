import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// PrimeNG Modules
import { MenubarModule } from 'primeng/menubar';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

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
        ToastModule
    ],
    templateUrl: './mini-survey-form.component.html',
    styleUrl: './mini-survey-form.component.scss'
})
export class MiniSurveyFormComponent {
    registrationForm: FormGroup;
    hasDisabilty: boolean = false;
    isSubmitting: boolean = false;

    private webhookUrl = 'https://n8n.kidskills.app/webhook-test/8c0717cb-dfeb-4fc5-9069-d8d0462f122f';

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private http: HttpClient
    ) {
        this.registrationForm = this.fb.group({
            childName: ['', [Validators.required, Validators.minLength(2)]],
            childBirthday: ['', Validators.required],
            hasDisability: [null, Validators.required],
            parentName: ['', [Validators.required, Validators.minLength(2)]],
            contactMethod: ['', Validators.required],
            parentEmail: [''],
            parentMobile: ['']
        });
    }

    ngOnInit(): void {}

    onSubmit() {
        // Add conditional validation based on contact method
        const contactMethod = this.contactMethod?.value;

        if (contactMethod === 'email') {
            this.registrationForm.get('parentEmail')?.setValidators([Validators.required, Validators.email]);
            this.registrationForm.get('parentMobile')?.clearValidators();
        } else if (contactMethod === 'mobile') {
            this.registrationForm.get('parentMobile')?.setValidators([Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]);
            this.registrationForm.get('parentEmail')?.clearValidators();
        }

        this.registrationForm.get('parentEmail')?.updateValueAndValidity();
        this.registrationForm.get('parentMobile')?.updateValueAndValidity();

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

    private submitToWebhook() {
        this.isSubmitting = true;

        const formData = {
            childName: this.registrationForm.get('childName')?.value,
            childBirthday: this.registrationForm.get('childBirthday')?.value,
            hasDisability: this.registrationForm.get('hasDisability')?.value,
            parentName: this.registrationForm.get('parentName')?.value,
            contactMethod: this.registrationForm.get('contactMethod')?.value,
            parentEmail: this.registrationForm.get('parentEmail')?.value || null,
            parentMobile: this.registrationForm.get('parentMobile')?.value || null,
            submittedAt: new Date().toISOString()
        };

        this.http.post(this.webhookUrl, formData).subscribe({
            next: (response) => {
                this.isSubmitting = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'تم الإرسال بنجاح',
                    detail: 'تم تسجيل بيانات الطفل بنجاح. سيتم التواصل معك قريباً.'
                });
                this.registrationForm.reset();
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

    onLogin(): void {
        console.log('Login clicked');
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
    get parentMobile() {
        return this.registrationForm.get('parentMobile');
    }
    get contactMethod() {
        return this.registrationForm.get('contactMethod');
    }

    isDarkMode = false;
    isHighContrast = false;

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        if (this.isDarkMode) {
            this.isHighContrast = false;
        }
    }

    toggleHighContrast() {
        this.isHighContrast = !this.isHighContrast;
        if (this.isHighContrast) {
            this.isDarkMode = false;
        }
    }

    getCalendarInputClass() {
        if (this.isHighContrast) {
            return 'border-white bg-black text-white focus:border-yellow-400 focus:ring-yellow-400/50 border-2';
        } else if (this.isDarkMode) {
            return 'border-gray-600 bg-gray-700 text-white focus:border-yellow-500 focus:ring-yellow-500/20';
        }
        return 'border-[#e6e3db] bg-white text-[#181611] focus:border-[#f9c024] focus:ring-[#f9c024]/20';
    }

    getSubmitButtonClass() {
        const baseClasses = 'font-bold px-8 py-3 rounded-full text-sm tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed';

        if (this.isHighContrast) {
            return `bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-white ${baseClasses}`;
        } else if (this.isDarkMode) {
            return `bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-none ${baseClasses}`;
        }
        return `bg-[#f9c024] hover:bg-[#e8b122] text-[#181611] border-none ${baseClasses}`;
    }
}
