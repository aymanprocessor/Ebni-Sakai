import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

import { TranslateService } from '@ngx-translate/core';
import { ChildrenService } from '../../services/children.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { Child } from '../../models/child.model';
import { DatePicker } from 'primeng/datepicker';
import { AgeToWordPipe } from '../../shared/pipes/age-to-word.pipe';
@Component({
    selector: 'app-children',
    templateUrl: './children.component.html',
    styleUrls: ['./children.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TranslateModule, ButtonModule, TableModule, DialogModule, DatePicker, SelectModule, ToolbarModule, ConfirmDialogModule, InputTextModule, AgeToWordPipe],
    providers: [ConfirmationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChildrenComponent implements OnInit {
    children: Child[] = [];
    childDialog: boolean = false;
    selectedChild: Child | null = null;
    submitted: boolean = false;
    maxBirthdayDate: Date = new Date();
    minBirthdayDate: Date = new Date();
    selectedBirthday: Date = new Date();
    childForm!: FormGroup;

    genderOptions: { label: string; value: 'Male' | 'Female' }[] = [];

    constructor(
        public childrenService: ChildrenService,
        private translateService: TranslateService,
        private sweetalertService: SweetalertService,
        private confirmationService: ConfirmationService,
        private fb: FormBuilder
    ) {
        this.maxBirthdayDate = new Date();
        this.minBirthdayDate.setMonth(this.minBirthdayDate.getMonth() - 84);

        this.selectedBirthday.setHours(0, 0, 0, 0);
        this.maxBirthdayDate.setHours(0, 0, 0, 0);
        this.minBirthdayDate.setHours(0, 0, 0, 0);
    }

    ngOnInit() {
        this.loadChildren();
        this.setupGenderOptions();
        this.initForm();
    }

    initForm() {
        this.childForm = this.fb.group({
            id: [null],
            name: ['', [Validators.required, Validators.minLength(2)]],
            birthday: [Date, Validators.required],
            gender: [null, Validators.required]
        });
    }

    setupGenderOptions() {
        this.genderOptions = [
            {
                label: this.translateService.instant('common.labels.male'),
                value: 'Male'
            },
            {
                label: this.translateService.instant('common.labels.female'),
                value: 'Female'
            }
        ];
    }

    loadChildren() {
        this.childrenService.getChildren().subscribe({
            next: (children) => {
                this.children = children;
            },
            error: (error) => {
                this.sweetalertService.showError(this.translateService.instant('common.messages.error'), this.translateService.instant('common.messages.loadingFailed'));
            }
        });
    }

    openNew() {
        this.childForm.reset({
            name: ''
            //birthday: new Date()
            // gender: 'Male'
        });
        this.submitted = false;
        this.childDialog = true;
    }

    editChild(child: Child) {
        this.childForm.patchValue(child);
        this.childDialog = true;
    }

    deleteChild(child: Child) {
        this.sweetalertService.showConfirmation(this.translateService.instant('common.messages.confirmDelete'), () => {
            if (child.id) {
                this.childrenService.deleteChild(child.id).subscribe({
                    next: () => {
                        this.children = this.children.filter((c) => c.id !== child.id);
                        this.sweetalertService.showSuccess(this.translateService.instant('common.messages.itemDeleted'));
                    },
                    error: () => {
                        this.sweetalertService.showError(this.translateService.instant('common.messages.error'), this.translateService.instant('common.messages.deleteFailed'));
                    }
                });
            }
        });
    }

    hideDialog() {
        this.childDialog = false;
        this.submitted = false;
        this.childForm.reset();
    }

    saveChild() {
        this.submitted = true;

        if (this.childForm.invalid) {
            return;
        }

        const childData: Child = this.childForm.value;

        if (childData.id) {
            // Update existing child
            this.childrenService.updateChild(childData).subscribe({
                next: () => {
                    const index = this.children.findIndex((c) => c.id === childData.id);
                    if (index !== -1) {
                        this.children[index] = childData;
                    }
                    this.childDialog = false;
                    this.sweetalertService.showSuccess(this.translateService.instant('common.messages.itemSaved'));
                },
                error: () => {
                    this.sweetalertService.showError(this.translateService.instant('common.messages.error'), this.translateService.instant('common.messages.saveFailed'));
                }
            });
        } else {
            // Create new child
            this.childrenService.addChild(childData).subscribe({
                next: (newChild) => {
                    if (newChild) {
                        this.children.push(newChild);
                    }
                    this.childDialog = false;
                    this.sweetalertService.showSuccess(this.translateService.instant('common.messages.itemSaved'));
                },
                error: () => {
                    this.sweetalertService.showError(this.translateService.instant('common.messages.error'), this.translateService.instant('common.messages.saveFailed'));
                }
            });
        }
    }

    // Getter for easy access to form controls in the template
    get f() {
        return this.childForm.controls;
    }

    onTodayClick(date: any) {
        this.selectedBirthday = date;
        console.log(this.selectedBirthday);
    }
}
