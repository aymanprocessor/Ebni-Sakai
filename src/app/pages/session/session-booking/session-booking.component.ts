// src/app/pages/session/session-booking/session-booking.component.ts
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
import { TabViewModule } from 'primeng/tabview';
import { ZoomMeetingComponent } from '../../zoom-meetings/zoom-meetings.component';
import { Booking } from '../../../models/booking.model';
import { ZoomMeeting } from '../../../models/zoom-meeting.model';
import { EnvironmentService } from '../../../services/environment.service';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-session-booking',
    standalone: true,
    imports: [
        SharedModule,
        DatePickerModule,
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        CalendarModule,
        DialogModule,
        ToastModule,
        DropdownModule,
        TextareaModule,
        TranslateModule,
        TooltipModule,
        SkeletonModule,
        ZoomMeetingComponent,
        TabViewModule
    ],
    providers: [MessageService],
    templateUrl: './session-booking.component.html'
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
    selectedSession: Booking | null = null;
    sessionToCancel: Booking | null = null;
    minDate: Date = new Date();
    loading: boolean = true;
    loadingTimeSlots: boolean = false;
    private destroy$ = new Subject<void>();

    // Zoom meeting related properties
    showZoomMeetingDialog: boolean = false;
    selectedZoomMeeting: ZoomMeeting | null = null;
    activeSessionTab: number = 0;

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private envService: EnvironmentService,
        private cdr: ChangeDetectorRef,

        private router: Router
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
                    this.envService.logDev('User sessions loaded:', this.sessions);
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

                    // Filter out booked slots
                    this.availableTimeSlots = slots
                        .filter((slot) => !slot.isBooked)
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

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    selectTimeSlot(timeSlot: TimeSlot): void {
        this.selectedTimeSlot = timeSlot;
        this.bookingNotes = '';
        this.showBookingDialog = true;
    }

    /**
     * Submit a booking with Zoom meeting
     */
    async submitBookingWithZoom(): Promise<void> {
        if (!this.selectedTimeSlot) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a time slot'
            });
            return;
        }

        try {
            // Book the time slot with Zoom meeting
            await this.bookingService.bookTimeSlotWithAutoAssignAndZoom(this.selectedTimeSlot.id!, this.bookingNotes);

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Session booked successfully with Zoom meeting'
            });

            this.showBookingDialog = false;
            this.loadUserSessions();
            this.resetForm();
        } catch (error) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to book session'
            });
            console.error('Error submitting booking:', error);
        }
    }

    resetForm(): void {
        this.showBookingDialog = false;
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingNotes = '';
        this.availableTimeSlots = [];
    }

    navigateHome(): void {
        // Store current responses before navigating away
        // this.storeCurrentResponses();
        // this.router.navigate(['/app/survey/list']);
    }

    viewSessionDetails(session: Booking): void {
        this.selectedSession = session;
        this.activeSessionTab = 0; // Set to details tab
        this.showZoomMeetingDialog = true;
    }

    joinZoomMeeting(session: Booking): void {
        if (!session.zoomMeeting) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No Zoom meeting available for this session'
            });
            return;
        }

        this.router.navigate(['app/zoom-meeting', session.id]);
        // this.selectedZoomMeeting = session.zoomMeeting;
        // this.activeSessionTab = 1; // Set to Zoom tab
        // this.showZoomMeetingDialog = true;
    }

    confirmCancelSession(session: Booking): void {
        this.sessionToCancel = session;
        this.showCancelDialog = true;
    }

    async cancelSession(): Promise<void> {
        if (!this.sessionToCancel || !this.sessionToCancel.timeSlotId) return;

        try {
            await this.bookingService.cancelBookingWithZoom(this.sessionToCancel.id!, this.sessionToCancel.timeSlotId);

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

    canModifySession(session: Booking): boolean {
        if (!session.timeSlot || session.status === 'cancelled') return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const timeDiff = sessionStart.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Allow modification only if session is at least 24 hours away
        return hoursDiff >= 24;
    }

    isSessionUpcoming(session: Booking): boolean {
        this.envService.logDev('isSessionUpcoming called', session);
        if (!session.timeSlot) return false;

        const now = new Date();
        return session.timeSlot.startTime > now && session.status !== 'cancelled';
    }

    isSessionInProgress(session: Booking): boolean {
        this.envService.logDev('isSessionInProgress called', session);

        if (!session.timeSlot) return false;

        const now = new Date();
        return session.timeSlot.startTime <= now && session.timeSlot.endTime >= now && session.status !== 'cancelled';
    }

    onZoomMeetingJoined(): void {
        console.log('Zoom meeting joined');
    }

    onZoomMeetingEnded(): void {
        console.log('Zoom meeting ended');
        this.showZoomMeetingDialog = false;
    }
}
