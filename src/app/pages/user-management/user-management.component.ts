// src/app/pages/user-management/user-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { UserProfile } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { UserManagementService } from '../../services/user-management.service';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, ToastModule, InputTextModule, SelectModule, ConfirmDialogModule, ToolbarModule, TagModule, CheckboxModule, TranslateModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './user-management.component.html'
})
export class UserManagementComponent implements OnInit, OnDestroy {
    users: UserProfile[] = [];
    userDialog = false;
    userForm!: FormGroup;
    isNewUser = false;
    loading = true;
    roles = [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Specialist', value: 'specialist' }
    ];
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private userManagementService: UserManagementService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private translateService: TranslateService
    ) {
        this.initForm();
    }

    ngOnInit() {
        this.loadUsers();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm() {
        this.userForm = this.fb.group({
            uid: [''],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            role: ['user', Validators.required],
            isSubscribed: [false],
            mobile: ['']
        });
    }

    loadUsers() {
        this.loading = true;
        this.userManagementService
            .getAllUsers()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (users) => {
                    this.users = users;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading users:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: this.translateService.instant('common.labels.error'),
                        detail: this.translateService.instant('pages.users.errors.loadFailed')
                    });
                    this.loading = false;
                }
            });
    }

    openNew() {
        this.isNewUser = true;
        this.userForm.reset({ role: 'user', isSubscribed: false });
        this.userForm.get('email')?.enable();
        this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.userForm.get('password')?.updateValueAndValidity();
        this.userDialog = true;
    }

    editUser(user: UserProfile) {
        this.isNewUser = false;
        // Combine firstName and lastName for the form
        const fullName = `${user.firstName} ${user.lastName}`.trim();
        this.userForm.patchValue({
            ...user,
            fullName: fullName
        });
        this.userForm.get('email')?.disable();
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        this.userDialog = true;
    }

    deleteUser(user: UserProfile) {
        this.confirmationService.confirm({
            message: this.translateService.instant('pages.users.confirmDelete', { name: `${user.firstName} ${user.lastName}` }),
            header: this.translateService.instant('common.labels.confirm'),
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.userManagementService
                    .deleteUser(user.uid)
                    .then(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: this.translateService.instant('common.labels.success'),
                            detail: this.translateService.instant('pages.users.deleteSuccess')
                        });
                        this.loadUsers();
                    })
                    .catch((error) => {
                        console.error('Error deleting user:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: this.translateService.instant('common.labels.error'),
                            detail: this.translateService.instant('pages.users.errors.deleteFailed')
                        });
                    });
            }
        });
    }

    async saveUser() {
        if (this.userForm.invalid) {
            Object.keys(this.userForm.controls).forEach((key) => {
                const control = this.userForm.get(key);
                if (control?.invalid) {
                    control.markAsTouched();
                }
            });
            return;
        }

        try {
            const userData = this.userForm.getRawValue();

            // Split fullName into firstName and lastName
            const nameParts = userData.fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ''; // Handle cases with no last name

            if (this.isNewUser) {
                // Create new user
                await this.userManagementService.createUser({
                    ...userData,
                    firstName,
                    lastName
                });
            } else {
                // Update existing user
                await this.userManagementService.updateUser({
                    uid: userData.uid,
                    firstName,
                    lastName,
                    role: userData.role,
                    isSubscribed: userData.isSubscribed,
                    mobile: userData.mobile
                });
            }

            this.messageService.add({
                severity: 'success',
                summary: this.translateService.instant('common.labels.success'),
                detail: this.translateService.instant('pages.users.saveSuccess')
            });

            this.userDialog = false;
            this.loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            this.messageService.add({
                severity: 'error',
                summary: this.translateService.instant('common.labels.error'),
                detail: this.translateService.instant('pages.users.errors.saveFailed')
            });
        }
    }

    getRoleSeverity(role: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        switch (role) {
            case 'admin':
                return 'danger';
            case 'specialist':
                return 'warn';
            default:
                return 'success';
        }
    }

    getRoleIcon(role: string): string {
        switch (role) {
            case 'admin':
                return 'pi pi-shield text-red-500';
            case 'specialist':
                return 'pi pi-star text-yellow-500';
            default:
                return 'pi pi-user text-green-500';
        }
    }

    hideDialog() {
        this.userDialog = false;
        this.userForm.reset();
    }

    isFieldInvalid(field: string): boolean {
        const control = this.userForm.get(field);
        return !!(control?.invalid && (control?.touched || control?.dirty));
    }
}
