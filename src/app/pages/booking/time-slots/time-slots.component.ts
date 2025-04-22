import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { Subscription } from 'rxjs';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';

import { BookingService } from '../../../services/booking.service';
import { TimeSlot } from '../../../models/time-slot.model';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-admin-time-slots',
    standalone: true,
    imports: [CommonModule, DatePickerModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, CalendarModule, ToastModule, ConfirmDialogModule, InputTextModule, CheckboxModule, DropdownModule, InputNumberModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './time-slots.component.html'
})
export class AdminTimeSlotsComponent implements OnInit, OnDestroy {
    timeSlots: TimeSlot[] = [];
    timeSlotDialog: boolean = false;
    isNewTimeSlot: boolean = true;

    timeSlotForm: FormGroup = new FormGroup({});
    isLoading: boolean = false;

    // New repeat functionality
    repeatOptions = [
        { label: 'None', value: 'none' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' }
    ];

    daysOfWeek = [
        { label: 'Monday', value: 1 },
        { label: 'Tuesday', value: 2 },
        { label: 'Wednesday', value: 3 },
        { label: 'Thursday', value: 4 },
        { label: 'Friday', value: 5 },
        { label: 'Saturday', value: 6 },
        { label: 'Sunday', value: 0 }
    ];

    private subscriptions: Subscription = new Subscription();
    new: Date | null | undefined;

    minDate: Date | undefined;
    maxDate: Date | undefined;

    constructor(
        private fb: FormBuilder,
        private bookingService: BookingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.loadTimeSlots();
        this.minDate = new Date();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    private initForm(): void {
        this.timeSlotForm = this.fb.group({
            id: [''],
            startTime: [null, Validators.required],
            endTime: [null, Validators.required],
            repeat: ['none'],
            repeatCount: [1, [Validators.required, Validators.min(1), Validators.max(30)]],
            repeatDays: [[]],
            repeatUntil: [null]
        });

        // Update form based on repeat selection
        this.timeSlotForm.get('repeat')?.valueChanges.subscribe((repeatType) => {
            this.updateRepeatFormControls(repeatType);
        });
    }

    private updateRepeatFormControls(repeatType: string): void {
        const repeatCountControl = this.timeSlotForm.get('repeatCount');
        const repeatDaysControl = this.timeSlotForm.get('repeatDays');
        const repeatUntilControl = this.timeSlotForm.get('repeatUntil');

        // Reset validations
        repeatCountControl?.clearValidators();
        repeatDaysControl?.clearValidators();
        repeatUntilControl?.clearValidators();

        if (repeatType !== 'none') {
            // Apply validations based on repeat type
            repeatCountControl?.setValidators([Validators.required, Validators.min(1), Validators.max(30)]);

            if (repeatType === 'weekly') {
                repeatDaysControl?.setValidators([Validators.required]);
            }
        }

        // Update form controls
        repeatCountControl?.updateValueAndValidity();
        repeatDaysControl?.updateValueAndValidity();
        repeatUntilControl?.updateValueAndValidity();
    }

    loadTimeSlots(): void {
        this.isLoading = true;
        const sub = this.bookingService.getAllTimeSlots().subscribe({
            next: (timeSlots) => {
                console.log('timeSlots', timeSlots);
                this.timeSlots = timeSlots;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading time slots:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load time slots.'
                });
                this.isLoading = false;
            }
        });

        this.subscriptions.add(sub);
    }

    openNew(): void {
        this.timeSlotForm.reset({
            repeat: 'none',
            repeatCount: 1,
            repeatDays: []
        });
        this.isNewTimeSlot = true;
        this.timeSlotDialog = true;
    }

    editTimeSlot(timeSlot: TimeSlot): void {
        this.isNewTimeSlot = false;
        this.timeSlotForm.patchValue({
            id: timeSlot.id,
            startTime: new Date(timeSlot.startTime),
            endTime: new Date(timeSlot.endTime),
            repeat: 'none',
            repeatCount: 1,
            repeatDays: []
        });
        this.timeSlotDialog = true;
    }

    deleteTimeSlot(timeSlot: TimeSlot): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this time slot?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.isLoading = true;
                this.bookingService
                    .deleteTimeSlot(timeSlot.id)
                    .then(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Time slot deleted successfully'
                        });
                        this.loadTimeSlots();
                    })
                    .catch((error) => {
                        console.error('Error deleting time slot:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete time slot'
                        });
                        this.isLoading = false;
                    });
            }
        });
    }

    saveTimeSlot(): void {
        if (this.timeSlotForm.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.timeSlotForm.controls).forEach((key) => {
                this.timeSlotForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValues = this.timeSlotForm.value;

        // Validate end time is after start time
        if (formValues.startTime >= formValues.endTime) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Time Range',
                detail: 'End time must be after start time'
            });
            return;
        }

        this.isLoading = true;

        if (this.isNewTimeSlot) {
            // Handle repeat logic
            if (formValues.repeat !== 'none') {
                this.createRepeatingTimeSlots(formValues);
            } else {
                // Create a single time slot
                this.createSingleTimeSlot(formValues);
            }
        } else {
            // Update existing time slot
            this.updateExistingTimeSlot(formValues);
        }
    }

    private createSingleTimeSlot(formValues: any): void {
        const newTimeSlot: any = {
            startTime: formValues.startTime,
            endTime: formValues.endTime
        };

        this.bookingService
            .createTimeSlot(newTimeSlot)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Time slot created successfully'
                });
                this.timeSlotDialog = false;
                this.loadTimeSlots();
            })
            .catch((error) => {
                console.error('Error creating time slot:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create time slot'
                });
                this.isLoading = false;
            });
    }

    private createRepeatingTimeSlots(formValues: any): void {
        const repeatType = formValues.repeat;
        const repeatCount = formValues.repeatCount || 1;
        const startTime = new Date(formValues.startTime);
        const endTime = new Date(formValues.endTime);
        const duration = endTime.getTime() - startTime.getTime();

        // Create an array to track all creation promises
        const createPromises: Promise<string>[] = [];

        // Create the first time slot
        const firstTimeSlot: any = {
            startTime: new Date(startTime),
            endTime: new Date(endTime)
        };

        createPromises.push(this.bookingService.createTimeSlot(firstTimeSlot));

        // Create additional time slots based on repeat type
        for (let i = 1; i < repeatCount; i++) {
            let nextStartTime = new Date(startTime);

            if (repeatType === 'daily') {
                nextStartTime.setDate(startTime.getDate() + i);
            } else if (repeatType === 'weekly') {
                nextStartTime.setDate(startTime.getDate() + i * 7);
            } else if (repeatType === 'monthly') {
                nextStartTime.setMonth(startTime.getMonth() + i);
            }

            const nextEndTime = new Date(nextStartTime.getTime() + duration);

            const timeSlot: any = {
                startTime: nextStartTime,
                endTime: nextEndTime
            };

            createPromises.push(this.bookingService.createTimeSlot(timeSlot));
        }

        // Wait for all time slots to be created
        Promise.all(createPromises)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `${repeatCount} time slots created successfully`
                });
                this.timeSlotDialog = false;
                this.loadTimeSlots();
            })
            .catch((error) => {
                console.error('Error creating repeating time slots:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create time slots'
                });
                this.isLoading = false;
            });
    }

    private updateExistingTimeSlot(formValues: any): void {
        const updatedTimeSlot = {
            startTime: formValues.startTime,
            endTime: formValues.endTime
        };

        this.bookingService
            .updateTimeSlot(formValues.id, updatedTimeSlot)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Time slot updated successfully'
                });
                this.timeSlotDialog = false;
                this.loadTimeSlots();
            })
            .catch((error) => {
                console.error('Error updating time slot:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update time slot'
                });
                this.isLoading = false;
            });
    }

    hideDialog(): void {
        this.timeSlotDialog = false;
    }

    formatDateTime(date: Date): string {
        return date.toLocaleString();
    }

    getStatus(timeSlot: TimeSlot): string {
        return timeSlot.isBooked ? 'Booked' : 'Available';
    }

    isRepeatEnabled(): boolean {
        return this.timeSlotForm.get('repeat')?.value !== 'none';
    }

    isWeeklyRepeat(): boolean {
        return this.timeSlotForm.get('repeat')?.value === 'weekly';
    }
}
