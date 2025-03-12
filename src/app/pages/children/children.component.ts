import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { TranslateService } from '@ngx-translate/core';
import { ChildrenService } from '../../services/children.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { Child } from '../../models/child.model';

@Component({
    selector: 'app-children',
    templateUrl: './children.component.html',
    styleUrls: ['./children.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, TableModule, DialogModule, CalendarModule, DropdownModule, ToolbarModule, ConfirmDialogModule],
    providers: [ConfirmationService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChildrenComponent implements OnInit {
    children: Child[] = [];
    childDialog: boolean = false;
    selectedChild: Child | null = null;
    submitted: boolean = false;
    maxBirthdayDate: Date = new Date();

    genderOptions: { label: string; value: 'Male' | 'Female' }[] = [];

    constructor(
        public childrenService: ChildrenService,
        private translateService: TranslateService,
        private sweetalertService: SweetalertService,
        private confirmationService: ConfirmationService
    ) {
        this.maxBirthdayDate = new Date();
    }

    ngOnInit() {
        this.loadChildren();
        this.setupGenderOptions();
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
        this.selectedChild = {
            name: '',
            birthday: new Date(),
            gender: 'Male'
        };
        this.submitted = false;
        this.childDialog = true;
    }

    editChild(child: Child) {
        this.selectedChild = { ...child };
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
    }

    saveChild() {
        this.submitted = true;

        if (!this.selectedChild?.name) {
            return;
        }

        if (this.selectedChild.id) {
            // Update existing child
            this.childrenService.updateChild(this.selectedChild).subscribe({
                next: () => {
                    const index = this.children.findIndex((c) => c.id === this.selectedChild?.id);
                    if (index !== -1 && this.selectedChild) {
                        this.children[index] = this.selectedChild;
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
            this.childrenService.addChild(this.selectedChild).subscribe({
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
}
