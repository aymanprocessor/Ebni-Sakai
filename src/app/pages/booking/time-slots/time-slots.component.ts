// src/app/admin/components/time-slots/time-slots.component.ts
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

import { BookingService } from '../../../services/booking.service';
import { TimeSlot } from '../../../models/time-slot.model';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-admin-time-slots',
    standalone: true,
    imports: [CommonModule, DatePickerModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, CalendarModule, ToastModule, ConfirmDialogModule, InputTextModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './time-slots.component.html'
})
export class AdminTimeSlotsComponent implements OnInit, OnDestroy {
    timeSlots: TimeSlot[] = [];
    timeSlotDialog: boolean = false;
    isNewTimeSlot: boolean = true;

    timeSlotForm: FormGroup = new FormGroup({});
    isLoading: boolean = false;

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
        this.timeSlotForm = this.fb.group({
            id: [''],
            startTime: [null, Validators.required],
            endTime: [null, Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadTimeSlots();
        this.minDate = new Date();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadTimeSlots(): void {
        this.isLoading = true;
        const sub = this.bookingService.getAllTimeSlots().subscribe({
            next: (timeSlots) => {
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
        this.timeSlotForm.reset();
        this.isNewTimeSlot = true;
        this.timeSlotDialog = true;
    }

    editTimeSlot(timeSlot: TimeSlot): void {
        this.isNewTimeSlot = false;
        this.timeSlotForm.patchValue({
            id: timeSlot.id,
            startTime: new Date(timeSlot.startTime),
            endTime: new Date(timeSlot.endTime)
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
            // Create new time slot
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
        } else {
            // Update existing time slot
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

    getStatusSeverity(timeSlot: TimeSlot): string {
        return timeSlot.isBooked ? 'danger' : 'success';
    }
}
