import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-role-selection-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, RadioButtonModule, FormsModule],
    template: `
        <p-dialog [(visible)]="visible" [modal]="true" [closable]="false" [draggable]="false" [resizable]="false" styleClass="role-selection-dialog" header="اختر نوع حسابك">
            <div class="p-4">
                <p class="text-gray-700 dark:text-gray-300 mb-4 text-lg">مرحباً! يرجى اختيار نوع الحساب المناسب لك:</p>

                <div class="space-y-4">
                    <div
                        class="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        (click)="selectedRole = 'user'"
                        [class.border-purple-500]="selectedRole === 'user'"
                        [class.bg-purple-50]="selectedRole === 'user'"
                    >
                        <p-radioButton name="role" value="user" [(ngModel)]="selectedRole" inputId="role-user"> </p-radioButton>
                        <label for="role-user" class="cursor-pointer flex-1">
                            <div class="font-bold text-lg">مستخدم عادي (User)</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">للآباء والأمهات والمستخدمين العاديين</div>
                        </label>
                    </div>

                    <div
                        class="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        (click)="selectedRole = 'specialist'"
                        [class.border-blue-500]="selectedRole === 'specialist'"
                        [class.bg-blue-50]="selectedRole === 'specialist'"
                    >
                        <p-radioButton name="role" value="specialist" [(ngModel)]="selectedRole" inputId="role-specialist"> </p-radioButton>
                        <label for="role-specialist" class="cursor-pointer flex-1">
                            <div class="font-bold text-lg">متخصص (Specialist)</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">للمتخصصين والمعالجين والمدربين</div>
                        </label>
                    </div>
                </div>

                <div class="mt-6 flex gap-3">
                    <button pButton pRipple label="تأكيد" icon="pi pi-check" class="p-button-success flex-1" (click)="confirm()" [disabled]="!selectedRole"></button>
                </div>
            </div>
        </p-dialog>
    `,
    styles: [
        `
            :host ::ng-deep {
                .role-selection-dialog {
                    .p-dialog {
                        width: 90%;
                        max-width: 500px;
                    }
                }
            }
        `
    ]
})
export class RoleSelectionDialogComponent {
    visible: boolean = false;
    selectedRole: 'user' | 'specialist' = 'user';

    @Output() roleSelected = new EventEmitter<'user' | 'specialist'>();

    show(): void {
        this.visible = true;
        this.selectedRole = 'user'; // Default
    }

    confirm(): void {
        this.visible = false;
        this.roleSelected.emit(this.selectedRole);
    }
}
