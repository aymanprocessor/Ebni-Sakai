import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageModule } from 'primeng/message';
import { MarkRequiredDirective } from '../../../shared/directives/mark-required.directive';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TimeSlot } from '../../../models/time-slot.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BookingService } from '../../../services/booking.service';

interface TimeSlotGeneration {
    day: string;
    date: Date;
    time: string;
    startTime: Date;
    endTime: Date;
}

interface StepOption {
    label: string;
    value: number;
}

@Component({
    selector: 'app-appointment-scheduler',
    standalone: true,
    imports: [MarkRequiredDirective, CommonModule, ReactiveFormsModule, SelectButtonModule, DatePickerModule, SelectModule, ButtonModule, CardModule, TranslateModule, MessageModule, ToastModule],
    providers: [MessageService],
    templateUrl: './appointment-scheduler.component.html'
})
export class AppointmentSchedulerComponent implements OnInit {
    appointmentForm!: FormGroup;
    weekdays: Array<{ label: string; value: string }> = [];
    stepOptions: StepOption[] = [];
    generatedTimeSlots: TimeSlotGeneration[] = [];
    submitted = false;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private translate: TranslateService,
        private bookingService: BookingService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.initializeForm();
        this.initializeTranslatedData();

        // Subscribe to language changes
        this.translate.onLangChange.subscribe(() => {
            this.initializeTranslatedData();
        });
    }

    private initializeForm() {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const startTime = new Date();
        startTime.setHours(9, 0, 0, 0);

        const endTime = new Date();
        endTime.setHours(17, 0, 0, 0);

        this.appointmentForm = this.fb.group(
            {
                selectedWeekdays: [[], [Validators.required]],
                startDate: [today, [Validators.required]],
                endDate: [nextWeek, [Validators.required]],
                startTime: [startTime, [Validators.required]],
                endTime: [endTime, [Validators.required]],
                selectedStep: [, [Validators.required]]
            },
            {
                validators: [this.dateRangeValidator, this.timeRangeValidator]
            }
        );
    }

    private dateRangeValidator(group: FormGroup) {
        const startDate = group.get('startDate')?.value;
        const endDate = group.get('endDate')?.value;

        if (startDate && endDate && startDate > endDate) {
            return { invalidDateRange: true };
        }
        return null;
    }

    private timeRangeValidator(group: FormGroup) {
        const startTime = group.get('startTime')?.value;
        const endTime = group.get('endTime')?.value;

        if (startTime && endTime) {
            const startHours = startTime.getHours();
            const startMinutes = startTime.getMinutes();
            const endHours = endTime.getHours();
            const endMinutes = endTime.getMinutes();

            if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
                return { invalidTimeRange: true };
            }
        }
        return null;
    }

    private initializeTranslatedData() {
        // Update weekdays with translations
        this.weekdays = [
            { label: this.translate.instant('common.weekdays.fri'), value: 'Friday' },
            { label: this.translate.instant('common.weekdays.sat'), value: 'Saturday' },
            { label: this.translate.instant('common.weekdays.sun'), value: 'Sunday' },
            { label: this.translate.instant('common.weekdays.mon'), value: 'Monday' },
            { label: this.translate.instant('common.weekdays.tue'), value: 'Tuesday' },
            { label: this.translate.instant('common.weekdays.wed'), value: 'Wednesday' },
            { label: this.translate.instant('common.weekdays.thu'), value: 'Thursday' }
        ];

        // Update step options with translations
        this.stepOptions = [
            { label: this.translate.instant('common.intervals.15_minutes'), value: 15 },
            { label: this.translate.instant('common.intervals.30_minutes'), value: 30 },
            { label: this.translate.instant('common.intervals.45_minutes'), value: 45 },
            { label: this.translate.instant('common.intervals.60_minutes'), value: 60 },
            { label: this.translate.instant('common.intervals.90_minutes'), value: 90 },
            { label: this.translate.instant('common.intervals.120_minutes'), value: 120 }
        ];

        // Set default selected step if not already set
        if (!this.appointmentForm.get('selectedStep')?.value) {
            this.appointmentForm.patchValue({ selectedStep: this.stepOptions[1] });
        }
    }

    async generateTimeSlots() {
        this.submitted = true;
        this.generatedTimeSlots = [];

        if (this.appointmentForm.invalid) {
            return;
        }

        this.isLoading = true;

        try {
            const formValue = this.appointmentForm.value;
            const currentDate = new Date(formValue.startDate);
            currentDate.setHours(0, 0, 0, 0);

            const timeSlotsToGenerate: TimeSlotGeneration[] = [];

            while (currentDate <= formValue.endDate) {
                const dayName = this.getDayName(currentDate.getDay());

                if (formValue.selectedWeekdays.includes(dayName)) {
                    const daySlots = this.generateDayTimeSlots(currentDate);
                    timeSlotsToGenerate.push(...daySlots);
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            this.generatedTimeSlots = timeSlotsToGenerate;

            // Show confirmation before saving
            if (confirm(this.translate.instant('pages.appointmentScheduler.confirmSave', { count: timeSlotsToGenerate.length }))) {
                await this.saveGeneratedTimeSlots(timeSlotsToGenerate);
            }
        } catch (error) {
            console.error('Error generating time slots:', error);
            this.messageService.add({
                severity: 'error',
                summary: this.translate.instant('common.labels.error'),
                detail: this.translate.instant('pages.appointmentScheduler.errors.generationFailed')
            });
        } finally {
            this.isLoading = false;
        }
    }

    private async saveGeneratedTimeSlots(slots: TimeSlotGeneration[]) {
        try {
            // Check for conflicts first
            const conflicts: string[] = [];
            for (const slot of slots) {
                const hasConflict = await this.bookingService.checkForConflicts(slot.startTime, slot.endTime);
                if (hasConflict) {
                    conflicts.push(`${this.formatDate(slot.date)} ${slot.time}`);
                }
            }

            if (conflicts.length > 0) {
                // Show conflict warning
                const proceed = confirm(this.translate.instant('pages.appointmentScheduler.conflicts', { slots: conflicts.join(', ') }));

                if (!proceed) {
                    return;
                }
            }

            // Create time slots
            const timeSlotsToCreate = slots.map(
                (slot) =>
                    ({
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isBooked: false
                    }) as Omit<TimeSlot, 'id'>
            );

            await this.bookingService.createMultipleTimeSlots(timeSlotsToCreate);

            this.messageService.add({
                severity: 'success',
                summary: this.translate.instant('common.labels.success'),
                detail: this.translate.instant('pages.appointmentScheduler.success', { count: slots.length })
            });

            // Reset form
            this.appointmentForm.reset();
            this.initializeForm();
            this.generatedTimeSlots = [];
            this.submitted = false;
        } catch (error) {
            console.error('Error saving time slots:', error);
            this.messageService.add({
                severity: 'error',
                summary: this.translate.instant('common.labels.error'),
                detail: this.translate.instant('pages.appointmentScheduler.errors.saveFailed')
            });
        }
    }

    private generateDayTimeSlots(date: Date): TimeSlotGeneration[] {
        const slots: TimeSlotGeneration[] = [];
        const formValue = this.appointmentForm.value;

        // Create a new date object for the current slot
        const current = new Date(date);
        current.setHours(formValue.startTime.getHours(), formValue.startTime.getMinutes(), 0, 0);

        // Create end time for comparison
        const endDateTime = new Date(date);
        endDateTime.setHours(formValue.endTime.getHours(), formValue.endTime.getMinutes(), 0, 0);

        while (current.getTime() < endDateTime.getTime()) {
            const slotStart = new Date(current);
            current.setMinutes(current.getMinutes() + formValue.selectedStep.value);
            const slotEnd = new Date(current);

            // Only add if end time is within bounds
            if (slotEnd.getTime() <= endDateTime.getTime()) {
                slots.push({
                    day: this.getDayName(slotStart.getDay()),
                    date: new Date(slotStart),
                    time: this.formatTime12Hour(slotStart),
                    startTime: slotStart,
                    endTime: slotEnd
                });
            }
        }

        return slots;
    }

    private getDayName(dayIndex: number): string {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    }

    private formatTime12Hour(date: Date): string {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Helper methods for template
    isFieldInvalid(fieldName: string): boolean {
        const field = this.appointmentForm.get(fieldName);
        return !!(field && field.invalid && (field.touched || this.submitted));
    }

    getErrorMessage(): string {
        return this.translate.instant('common.validation.required');
    }
}
