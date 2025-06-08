import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

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

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService
    ) {
        this.registrationForm = this.fb.group({
            childName: ['', [Validators.required, Validators.minLength(2)]],
            childBirthday: ['', Validators.required],
            hasDisabilty: [false, Validators.required], // Note: you may want to rename this to hasAllergies
            parentName: ['', [Validators.required, Validators.minLength(2)]],
            contactMethod: ['', Validators.required], // New field
            parentEmail: [''], // Now conditionally required
            parentMobile: [''] // Now conditionally required
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
            // Process form submission
            console.log(this.registrationForm.value);
        }
    }
    onLogin(): void {
        // Handle login logic here
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
        if (this.isHighContrast) {
            return 'bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-white font-bold px-8 py-3 rounded-full text-sm tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed';
        } else if (this.isDarkMode) {
            return 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 border-none font-bold px-8 py-3 rounded-full text-sm tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed';
        }
        return 'bg-[#f9c024] hover:bg-[#e8b122] text-[#181611] border-none font-bold px-8 py-3 rounded-full text-sm tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed';
    }
}
