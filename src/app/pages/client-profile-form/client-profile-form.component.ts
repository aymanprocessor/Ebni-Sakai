import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

interface SelectOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-client-profile-form',
    templateUrl: './client-profile-form.component.html',
    styleUrls: ['./client-profile-form.component.scss'],
    imports: [NgFor, NgIf, ReactiveFormsModule, FormsModule, CardModule, InputTextModule, TextareaModule, InputNumberModule, DropdownModule, RadioButtonModule, CheckboxModule, ButtonModule, ToastModule]
})
export class ClientProfileFormComponent implements OnInit {
    clientForm: FormGroup;
    isDarkMode = false;

    // Form Options
    educationLevels: SelectOption[] = [
        { label: 'الشهادة الثانوية أو أقل', value: 'secondary' },
        { label: 'شهادة جامعية (بكالوريوس - ليسانس)', value: 'bachelor' },
        { label: 'دراسات عليا (دكتوراة - ماجستير)', value: 'graduate' }
    ];

    maritalStatuses: SelectOption[] = [
        { label: 'متزوج/ة', value: 'married' },
        { label: 'أعزب/ة', value: 'single' },
        { label: 'مطلق/ة', value: 'divorced' },
        { label: 'أرمل/ة', value: 'widowed' }
    ];

    yesNoOptions: SelectOption[] = [
        { label: 'نعم', value: 'yes' },
        { label: 'لا', value: 'no' }
    ];

    schoolTypes: SelectOption[] = [
        { label: 'دولية', value: 'international' },
        { label: 'خاصة', value: 'private' },
        { label: 'حكومية', value: 'public' },
        { label: 'تعليم منزلي', value: 'homeschool' }
    ];

    housingTypes: SelectOption[] = [
        { label: 'شقة', value: 'apartment' },
        { label: 'فيلا', value: 'villa' },
        { label: 'بيت مستقل', value: 'house' }
    ];

    leisureActivities: SelectOption[] = [
        { label: 'مع العائلة', value: 'family' },
        { label: 'ممارسة هواية', value: 'hobby' },
        { label: 'تصفح الإنترنت', value: 'internet' },
        { label: 'الخروج مع الأصدقاء', value: 'friends' }
    ];

    advisorySources: SelectOption[] = [
        { label: 'كتب', value: 'books' },
        { label: 'فيديوهات يوتيوب', value: 'youtube' },
        { label: 'استشاريين تربويين', value: 'consultants' },
        { label: 'تجارب شخصية', value: 'personal' },
        { label: 'مقالات', value: 'articles' },
        { label: 'دورات تدريبية', value: 'courses' },
        { label: 'السوشيال ميديا', value: 'social' },
        { label: 'نصائح من الأهل والأصدقاء', value: 'family_friends' }
    ];

    socialMediaBehaviors: SelectOption[] = [
        { label: 'لا أستعمل السوشيال ميديا على الإطلاق', value: 'none' },
        { label: 'أشاهد فقط الفيديوهات والبوستات بدون تفاعل', value: 'passive' },
        { label: 'أتفاعل مع المحتوى الذي أشاهده', value: 'interactive' },
        { label: 'أقوم بإنشاء محتوى على السوشيال ميديا', value: 'creator' }
    ];

    socialMediaPlatforms: SelectOption[] = [
        { label: 'فيسبوك', value: 'facebook' },
        { label: 'إنستجرام', value: 'instagram' },
        { label: 'سناب شات', value: 'snapchat' },
        { label: 'تيك توك', value: 'tiktok' },
        { label: 'يوتيوب', value: 'youtube' }
    ];

    influenceFactors: SelectOption[] = [
        { label: 'رأي الشريك الزوج', value: 'spouse' },
        { label: 'الأهل والأصدقاء', value: 'family_friends' },
        { label: 'رأي أخصائي التربية', value: 'specialist' },
        { label: 'قناعات شخصية', value: 'personal' },
        { label: 'دينية', value: 'religious' }
    ];

    appMotivations: SelectOption[] = [
        { label: 'قلة الوقت للبحث عن نصائح تربوية موثوقة', value: 'time' },
        { label: 'عدم وجود مرجع واضح', value: 'reference' },
        { label: 'صعوبة التعامل مع سلوكيات الأطفال', value: 'behavior' },
        { label: 'الرغبة في تحسين العلاقة مع أطفالك', value: 'relationship' },
        { label: 'توفير التكلفة مقارنة بالاستشارات التقليدية', value: 'cost' }
    ];

    contentTypes: SelectOption[] = [
        { label: 'المحتوى التربوي المكتوب', value: 'written' },
        { label: 'فيديوهات قصيرة تتحدث عن التربية', value: 'videos' }
    ];

    notificationMethods: SelectOption[] = [
        { label: 'واتساب', value: 'whatsapp' },
        { label: 'البريد الإلكتروني', value: 'email' },
        { label: 'رسالة نصية', value: 'sms' },
        { label: 'إشعارات من داخل التطبيق', value: 'push' }
    ];

    mockFormData = {
        name: 'John Doe',
        age: 32,
        job: 'Software Engineer',
        education: "Bachelor's",
        maritalStatus: 'Married',
        address: '123 Main Street, Cityville',

        // Children Information
        hasChildren: 'yes',
        childrenDetails: '2 children, ages 4 and 7',
        schoolType: 'public',
        childrenMorningRoutine: 'Breakfast and school drop-off',
        eveningTimeWithChildren: 'Story time and games',

        // Housing and Transportation
        housingType: 'apartment',
        hasCar: 'yes',

        // Activities and Lifestyle
        playsports: 'yes',
        sportsType: 'football',
        hasClubMembership: 'no',
        clubName: null,
        leisureTime: ['family', 'hobby', 'friends', 'internet'],
        otherLeisureActivities: 'painting, cooking',
        morningRoutine: 'Yoga and breakfast',
        frequentPlaces: 'park, gym, supermarket',

        // Parenting and Advisory
        advisorySources: ['family_friends', 'internet', 'books'],
        consultedSpecialist: 'yes',
        usesParentingApps: 'yes',
        parentingAppsNames: 'ParentPal, BabyCenter',

        // Social Media
        socialMediaBehavior: 'passive',
        socialMediaPlatforms: ['facebook', 'instagram'],
        phoneType: 'iPhone',

        // Parenting Challenges
        influenceFactors: ['spouse', 'parents'],
        otherInfluenceFactors: 'culture',
        parentingChallenges: 'balancing work and parenting',
        parentingGuilt: 'not spending enough time',
        compensationBehaviors: 'buying gifts',
        parentingDreams: 'raise independent and happy children',
        advisoryProblems: 'conflicting advice from sources',

        // App Preferences
        appMotivations: ['cost', 'features'],
        contentPreference: 'articles',
        notificationMethod: 'email'
    };

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private http: HttpClient
    ) {
        this.clientForm = this.createForm(this.mockFormData);
    }

    ngOnInit(): void {
        this.setupFormSubscriptions();
        this.loadDarkModePreference();
    }

    private loadDarkModePreference(): void {
        const savedTheme = localStorage.getItem('darkMode');
        this.isDarkMode = savedTheme === 'true';
        this.applyTheme(true);
        console.log('Initial Dark Mode:', this.isDarkMode);
    }

    toggleDarkMode(): void {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('darkMode', this.isDarkMode.toString());

        const themeMessage = this.isDarkMode ? 'تم تفعيل الوضع المظلم' : 'تم تفعيل الوضع المضيء';
        this.showMessage('info', 'تغيير المظهر', themeMessage);

        // Force a full page reflow and style recalculation
        window.dispatchEvent(new Event('resize'));
    }

    private applyTheme(initial: boolean = false): void {
        const html = document.documentElement;
        const body = document.body;

        // Remove both classes first to ensure clean state
        html.classList.remove('dark-theme', 'light-theme');
        body.classList.remove('dark-theme', 'light-theme');

        // Add appropriate theme class
        const themeClass = this.isDarkMode ? 'dark-theme' : 'light-theme';
        html.classList.add(themeClass);
        body.classList.add(themeClass);

        console.log('Applying Theme:', themeClass);

        // Force reflow to ensure theme is applied
        if (!initial) {
            void body.offsetHeight;
            window.dispatchEvent(new Event('resize'));
        }
    }

    private createForm(mockData?: any): FormGroup {
        const data = mockData || {};

        return this.fb.group({
            // Basic Information
            name: [data.name || '', [Validators.required, Validators.minLength(2)]],
            age: [data.age || '', [Validators.required, Validators.min(18), Validators.max(100)]],
            job: [data.job || '', [Validators.required]],
            education: [data.education || '', [Validators.required]],
            maritalStatus: [data.maritalStatus || '', [Validators.required]],
            address: [data.address || '', [Validators.required]],

            // Children Information
            hasChildren: [data.hasChildren || '', [Validators.required]],
            childrenDetails: [data.childrenDetails || ''],
            schoolType: [data.schoolType || ''],
            childrenMorningRoutine: [data.childrenMorningRoutine || ''],
            eveningTimeWithChildren: [data.eveningTimeWithChildren || ''],

            // Housing and Transportation
            housingType: [data.housingType || '', [Validators.required]],
            hasCar: [data.hasCar || '', [Validators.required]],

            // Activities and Lifestyle
            playsports: [data.playsports || '', [Validators.required]],
            sportsType: [data.sportsType || ''],
            hasClubMembership: [data.hasClubMembership || '', [Validators.required]],
            clubName: [data.clubName || ''],
            leisureTime: [data.leisureTime || [], [Validators.required]],
            otherLeisureActivities: [data.otherLeisureActivities || ''],
            morningRoutine: [data.morningRoutine || '', [Validators.required]],
            frequentPlaces: [data.frequentPlaces || ''],

            // Parenting and Advisory
            advisorySources: [data.advisorySources || [], [Validators.required]],
            consultedSpecialist: [data.consultedSpecialist || '', [Validators.required]],
            usesParentingApps: [data.usesParentingApps || '', [Validators.required]],
            parentingAppsNames: [data.parentingAppsNames || ''],

            // Social Media
            socialMediaBehavior: [data.socialMediaBehavior || '', [Validators.required]],
            socialMediaPlatforms: [data.socialMediaPlatforms || []],
            phoneType: [data.phoneType || '', [Validators.required]],

            // Parenting Challenges
            influenceFactors: [data.influenceFactors || [], [Validators.required]],
            otherInfluenceFactors: [data.otherInfluenceFactors || ''],
            parentingChallenges: [data.parentingChallenges || '', [Validators.required]],
            parentingGuilt: [data.parentingGuilt || '', [Validators.required]],
            compensationBehaviors: [data.compensationBehaviors || '', [Validators.required]],
            parentingDreams: [data.parentingDreams || '', [Validators.required]],
            advisoryProblems: [data.advisoryProblems || '', [Validators.required]],

            // App Preferences
            appMotivations: [data.appMotivations || [], [Validators.required]],
            contentPreference: [data.contentPreference || '', [Validators.required]],
            notificationMethod: [data.notificationMethod || '', [Validators.required]]
        });
    }

    private setupFormSubscriptions(): void {
        // Children fields validation
        this.clientForm.get('hasChildren')?.valueChanges.subscribe((value) => {
            this.updateChildrenValidators(value === 'yes');
        });

        // Sports validation
        this.clientForm.get('playsports')?.valueChanges.subscribe((value) => {
            this.updateFieldValidator('sportsType', value === 'yes');
        });

        // Club validation
        this.clientForm.get('hasClubMembership')?.valueChanges.subscribe((value) => {
            this.updateFieldValidator('clubName', value === 'yes');
        });

        // Parenting apps validation
        this.clientForm.get('usesParentingApps')?.valueChanges.subscribe((value) => {
            this.updateFieldValidator('parentingAppsNames', value === 'yes');
        });

        // Social media platforms validation
        this.clientForm.get('socialMediaBehavior')?.valueChanges.subscribe((value) => {
            this.updateFieldValidator('socialMediaPlatforms', value !== 'none');
        });
    }

    private updateChildrenValidators(hasChildren: boolean): void {
        const fields = ['childrenDetails', 'schoolType', 'childrenMorningRoutine', 'eveningTimeWithChildren'];
        fields.forEach((field) => this.updateFieldValidator(field, hasChildren));
    }

    private updateFieldValidator(fieldName: string, isRequired: boolean): void {
        const control = this.clientForm.get(fieldName);
        if (!control) return;

        if (isRequired) {
            control.setValidators([Validators.required]);
        } else {
            control.clearValidators();
            control.reset();
        }
        control.updateValueAndValidity();
    }

    onSubmit(): void {
        if (this.clientForm.valid) {
            console.log('Form Data:', this.clientForm.value);
            this.sendDataToWebhook(this.clientForm.value);
            this.showMessage('success', 'تم الإرسال بنجاح', 'تم حفظ بياناتك بنجاح');
        } else {
            this.markFormGroupTouched();
            this.showMessage('error', 'خطأ في النموذج', 'يرجى التأكد من ملء جميع الحقول المطلوبة');
        }
    }

    private sendDataToWebhook(formData: any): void {
        const webhookUrl = 'https://n8n.kidskills.app/webhook/send-client-profile-form';

        this.http.post(webhookUrl, formData).subscribe({
            next: (response) => {
                console.log('Data successfully sent to webhook:', response);
            },
            error: (err) => {
                console.error('Error sending data to webhook:', err);
                this.showMessage('error', 'خطأ في الاتصال', 'حدث خطأ أثناء إرسال البيانات');
            }
        });
    }

    onReset(): void {
        this.clientForm.reset();
        this.showMessage('info', 'تم المسح', 'تم مسح جميع البيانات');
    }

    private markFormGroupTouched(): void {
        Object.keys(this.clientForm.controls).forEach((key) => {
            this.clientForm.get(key)?.markAsTouched();
        });
    }

    private showMessage(severity: string, summary: string, detail: string): void {
        this.messageService.add({ severity, summary, detail });
    }

    // Validation Helper Methods
    isFieldInvalid(fieldName: string): boolean {
        const field = this.clientForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.clientForm.get(fieldName);
        if (field?.errors) {
            if (field.errors['required']) return 'هذا الحقل مطلوب';
            if (field.errors['minlength']) return `الحد الأدنى ${field.errors['minlength'].requiredLength} أحرف`;
            if (field.errors['min']) return `القيمة الدنيا ${field.errors['min'].min}`;
            if (field.errors['max']) return `القيمة العليا ${field.errors['max'].max}`;
        }
        return '';
    }
}
