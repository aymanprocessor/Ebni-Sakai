// src/app/specialist/components/specialist-availability/specialist-availability.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { SpecialistService } from '../../services/specialist.service';

interface WeekDay {
    name: string;
    value: number;
    selected: boolean;
}

interface TimeRange {
    start: Date;
    end: Date;
}

@Component({
    selector: 'app-specialist-availability',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DatePickerModule, CheckboxModule, DialogModule, ToastModule, TableModule, TranslateModule],
    providers: [MessageService],
    templateUrl: './specialist-availability.component.html'
})
export class SpecialistAvailabilityComponent implements OnInit {
    availabilityForm!: FormGroup;
    weekDays: WeekDay[] = [
        { name: 'Sunday', value: 0, selected: false },
        { name: 'Monday', value: 1, selected: true },
        { name: 'Tuesday', value: 2, selected: true },
        { name: 'Wednesday', value: 3, selected: true },
        { name: 'Thursday', value: 4, selected: true },
        { name: 'Friday', value: 5, selected: true },
        { name: 'Saturday', value: 6, selected: false }
    ];
    defaultWorkHours: TimeRange = {
        start: new Date().setHours(9, 0, 0, 0) as unknown as Date,
        end: new Date().setHours(17, 0, 0, 0) as unknown as Date
    };

    isAvailable: boolean = true;
    loading: boolean = false;
    savingAvailability: boolean = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private specialistService: SpecialistService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.initializeForm();
        this.loadSpecialistAvailability();
    }

    private initializeForm(): void {
        this.availabilityForm = this.fb.group({
            isAvailable: [true],
            customDays: this.fb.array([])
        });

        // Initialize with default work days
        this.addDefaultWorkDays();
    }

    private addDefaultWorkDays(): void {
        const customDays = this.availabilityForm.get('customDays') as FormArray;

        // Add each selected weekday
        this.weekDays.forEach((day) => {
            if (day.selected) {
                customDays.push(this.createDayFormGroup(day));
            }
        });
    }

    private createDayFormGroup(day: WeekDay): FormGroup {
        return this.fb.group({
            dayOfWeek: [day.value],
            dayName: [day.name],
            enabled: [true],
            timeRanges: this.fb.array([
                this.fb.group({
                    start: [this.defaultWorkHours.start],
                    end: [this.defaultWorkHours.end]
                })
            ])
        });
    }

    private loadSpecialistAvailability(): void {
        this.loading = true;

        // Check if current user is a specialist
        this.authService.currentUser$.subscribe((user) => {
            if (!user) {
                this.loading = false;
                return;
            }

            // Load specialist profile
            this.specialistService.getSpecialistByUserId(user.uid).subscribe({
                next: (specialist) => {
                    if (specialist) {
                        // Update form with saved availability
                        this.isAvailable = specialist.isAvailable;
                        this.availabilityForm.patchValue({ isAvailable: specialist.isAvailable });

                        // Load custom schedule if it exists
                        if (specialist.availabilitySchedule) {
                            this.updateFormWithSchedule(specialist.availabilitySchedule);
                        }
                    }
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading specialist availability:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load your availability settings'
                    });
                    this.loading = false;
                }
            });
        });
    }

    private updateFormWithSchedule(schedule: any): void {
        // Implementation depends on how the schedule is stored
        // This is a placeholder
        const customDays = this.availabilityForm.get('customDays') as FormArray;
        customDays.clear();

        if (schedule && Array.isArray(schedule.days)) {
            schedule.days.forEach((day: any) => {
                const dayGroup = this.fb.group({
                    dayOfWeek: [day.dayOfWeek],
                    dayName: [this.weekDays.find((d) => d.value === day.dayOfWeek)?.name],
                    enabled: [day.enabled],
                    timeRanges: this.fb.array([])
                });

                const timeRanges = dayGroup.get('timeRanges') as FormArray;
                day.timeRanges.forEach((range: any) => {
                    timeRanges.push(
                        this.fb.group({
                            start: [range.start.toDate()],
                            end: [range.end.toDate()]
                        })
                    );
                });

                customDays.push(dayGroup);
            });
        } else {
            // Fallback to default schedule
            this.addDefaultWorkDays();
        }
    }

    get customDays(): FormArray {
        return this.availabilityForm.get('customDays') as FormArray;
    }

    getTimeRanges(dayIndex: number): FormArray {
        return this.customDays.at(dayIndex).get('timeRanges') as FormArray;
    }

    addTimeRange(dayIndex: number): void {
        const timeRanges = this.getTimeRanges(dayIndex);
        timeRanges.push(
            this.fb.group({
                start: [this.defaultWorkHours.start],
                end: [this.defaultWorkHours.end]
            })
        );
    }

    removeTimeRange(dayIndex: number, rangeIndex: number): void {
        const timeRanges = this.getTimeRanges(dayIndex);
        if (timeRanges.length > 1) {
            timeRanges.removeAt(rangeIndex);
        } else {
            this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'At least one time range is required'
            });
        }
    }

    toggleDayEnabled(dayIndex: number): void {
        const day = this.customDays.at(dayIndex);
        day.get('enabled')?.setValue(!day.get('enabled')?.value);
    }

    addWorkDay(): void {
        // Find first unselected day
        const unselectedDay = this.weekDays.find((day) => !this.customDays.value.some((customDay: any) => customDay.dayOfWeek === day.value));

        if (unselectedDay) {
            this.customDays.push(this.createDayFormGroup(unselectedDay));
        } else {
            this.messageService.add({
                severity: 'info',
                summary: 'Info',
                detail: 'All days of the week are already added'
            });
        }
    }

    removeWorkDay(dayIndex: number): void {
        this.customDays.removeAt(dayIndex);
    }

    toggleGlobalAvailability(): void {
        this.isAvailable = !this.isAvailable;
        this.availabilityForm.patchValue({ isAvailable: this.isAvailable });
    }

    saveAvailability(): void {
        if (this.availabilityForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please correct the form errors before saving'
            });
            return;
        }

        this.savingAvailability = true;

        this.authService.currentUser$.subscribe((user) => {
            if (!user) {
                this.savingAvailability = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'You must be logged in to save your availability'
                });
                return;
            }

            const formValue = this.availabilityForm.value;

            // Save to specialist profile
            this.specialistService
                .updateSpecialistAvailability(user.uid, formValue.isAvailable, {
                    days: formValue.customDays
                })
                .subscribe({
                    next: () => {
                        this.savingAvailability = false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Your availability has been updated'
                        });
                    },
                    error: (error) => {
                        console.error('Error saving availability:', error);
                        this.savingAvailability = false;
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to save your availability'
                        });
                    }
                });
        });
    }
}
