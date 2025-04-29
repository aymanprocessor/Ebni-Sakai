// src/app/pages/session/session-booking/session-booking.component.ts
import { Booking } from './../../../models/booking.model';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { TimeSlot } from '../../../models/time-slot.model';
import { BookingService } from '../../../services/booking.service';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-session-booking',
    standalone: true,
    imports: [SharedModule, DatePickerModule, CommonModule, FormsModule, TableModule, ButtonModule, CalendarModule, DialogModule, ToastModule, DropdownModule, TextareaModule, TranslateModule, TooltipModule, SkeletonModule],
    providers: [MessageService],
    templateUrl: './session-booking.component.html',
    styleUrls: ['./session-booking.component.scss']
})
export class SessionBookingComponent implements OnInit, OnDestroy {
    sessions: Booking[] = [];
    availableTimeSlots: any[] = [];
    availableDates: Date[] = [];
    disabledDates: Date[] = [];
    selectedDate: Date | null = null;
    selectedTimeSlot: TimeSlot | null = null;
    bookingNotes: string = '';
    showBookingDialog: boolean = false;
    showCancelDialog: boolean = false;
    editingSession: Booking | null = null;
    sessionToCancel: Booking | null = null;
    minDate: Date = new Date();
    loading: boolean = true;
    loadingTimeSlots: boolean = false;
    private destroy$ = new Subject<void>();

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadUserSessions();
        this.loadAvailableDates();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadUserSessions(): void {
        this.loading = true;
        this.bookingService
            .getUserBookings()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (sessions) => {
                    this.sessions = sessions.sort((a, b) => {
                        // Sort by start time, placing upcoming sessions first
                        if (a.timeSlot && b.timeSlot) {
                            return a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime();
                        }
                        return 0;
                    });
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load sessions'
                    });
                    console.error('Error loading sessions:', error);
                }
            });
    }

    loadAvailableDates(): void {
        const today = new Date();
        this.bookingService
            .getAvailableDates(today, 60)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (dates) => {
                    this.availableDates = dates;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load available dates'
                    });
                    console.error('Error loading available dates:', error);
                }
            });
    }

    onDateSelect(): void {
        if (!this.selectedDate) return;

        this.loadingTimeSlots = true;
        this.selectedTimeSlot = null;

        const startOfDay = new Date(this.selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(this.selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        this.bookingService
            .getTimeSlotsInRange(startOfDay, endOfDay)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (slots) => {
                    this.loadingTimeSlots = false;

                    // Filter out booked slots if not editing
                    this.availableTimeSlots = slots
                        .filter((slot) => {
                            // If editing, include the current session's time slot
                            if (this.editingSession && this.editingSession.timeSlotId === slot.id) {
                                return true;
                            }
                            return !slot.isBooked;
                        })
                        .map((slot) => ({
                            ...slot,
                            displayLabel: `${slot.startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })} - ${slot.endTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`
                        }));

                    // If editing, pre-select the current time slot
                    if (this.editingSession && this.editingSession.timeSlot) {
                        this.selectedTimeSlot = this.availableTimeSlots.find((slot) => slot.id === this.editingSession!.timeSlotId) || null;
                    }

                    this.cdr.detectChanges();
                },
                error: (error) => {
                    this.loadingTimeSlots = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load available time slots'
                    });
                    console.error('Error loading time slots:', error);
                }
            });
    }

    isDateAvailable = (date: Date): boolean => {
        return this.availableDates.some((availableDate) => availableDate.toDateString() === date.toDateString());
    };

    canModifySession(session: Booking): boolean {
        if (!session.timeSlot || session.status === 'cancelled') return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const timeDiff = sessionStart.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Allow modification only if session is at least 24 hours away
        return hoursDiff >= 24;
    }

    editSession(session: Booking): void {
        if (!this.canModifySession(session)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cannot Edit',
                detail: 'Sessions can only be edited at least 24 hours before the scheduled time.'
            });
            return;
        }

        this.editingSession = session;
        this.selectedDate = session.timeSlot ? new Date(session.timeSlot.startTime) : null;
        this.bookingNotes = session.notes || '';
        this.showBookingDialog = true;

        // Load available time slots for the selected date
        if (this.selectedDate) {
            this.onDateSelect();
        }
    }

    confirmCancelSession(session: Booking): void {
        if (!this.canModifySession(session)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cannot Cancel',
                detail: 'Sessions can only be cancelled at least 24 hours before the scheduled time.'
            });
            return;
        }

        this.sessionToCancel = session;
        this.showCancelDialog = true;
    }

    async cancelSession(): Promise<void> {
        if (!this.sessionToCancel || !this.sessionToCancel.timeSlotId) return;

        try {
            await this.bookingService.cancelBooking(this.sessionToCancel.id!, this.sessionToCancel.timeSlotId);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Session cancelled successfully'
            });

            this.loadUserSessions();
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to cancel session'
            });
            console.error('Error cancelling session:', error);
        } finally {
            this.showCancelDialog = false;
            this.sessionToCancel = null;
        }
    }

    async submitBooking(): Promise<void> {
        if (!this.selectedTimeSlot) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a time slot'
            });
            return;
        }

        try {
            if (this.editingSession) {
                // For updating, cancel the existing booking and create a new one
                await this.bookingService.cancelBooking(this.editingSession.id!, this.editingSession.timeSlotId);

                // Use auto-assign method for booking with the least busy specialist
                await this.bookingService.bookTimeSlotWithAutoAssign(this.selectedTimeSlot.id!, this.bookingNotes);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Session updated successfully'
                });
            } else {
                // Create new session with auto-assignment
                await this.bookingService.bookTimeSlotWithAutoAssign(this.selectedTimeSlot.id!, this.bookingNotes);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Session booked successfully'
                });
            }

            this.loadUserSessions();
            this.resetForm();
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: this.editingSession ? 'Failed to update session' : 'Failed to book session'
            });
            console.error('Error submitting booking:', error);
        }
    }

    resetForm(): void {
        this.showBookingDialog = false;
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingNotes = '';
        this.editingSession = null;
        this.availableTimeSlots = [];
    }
}
