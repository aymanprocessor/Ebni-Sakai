import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { TabViewModule } from 'primeng/tabview';
import { ZoomMeetingComponent } from '../../zoom-meetings/zoom-meetings.component';
import { Booking } from '../../../models/booking.model';
import { EnvironmentService } from '../../../services/environment.service';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ZoomService } from '../../../services/zoom.service';
import { SweetalertService } from '../../../services/sweetalert.service';

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
        TabViewModule,
        RouterModule,
        CardModule,
        BadgeModule,
        TagModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService],
    templateUrl: './session-booking.component.html',
    styles: [
        `
            :host ::ng-deep .card-no-round-top .p-card-header {
                border-top-left-radius: 0;
                border-top-right-radius: 0;
            }
        `
    ]
})
export class SessionBookingComponent implements OnInit, OnDestroy {
    // Sessions data
    upcomingSessions: Booking[] = [];
    completedSessions: Booking[] = [];
    pastSessions: Booking[] = [];

    // Time slots data
    availableTimeSlots: any[] = [];
    disabledDates: Date[] = [];
    selectedDate: Date | null = null;
    selectedTimeSlot: TimeSlot | null = null;
    bookingNotes: string = '';
    minDate: Date = new Date();

    // UI state
    loading: boolean = true;
    loadingTimeSlots: boolean = false;
    showBookingDialog: boolean = false;
    showZoomMeetingDialog: boolean = false;
    showCancelDialog: boolean = false;
    isSubmitting: boolean = false;
    isCancelling: boolean = false;

    // Selected session data
    selectedSession: Booking | null = null;
    sessionToCancel: Booking | null = null;
    activeSessionTab: number = 0;

    private destroy$ = new Subject<void>();

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private translateService: TranslateService,
        private envService: EnvironmentService,
        private zoomService: ZoomService,
        private router: Router,
        private sweetalertService: SweetalertService
    ) {}

    ngOnInit(): void {
        this.loadBookings();
        this.loadDisabledDates();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Load all bookings and split into upcoming, completed, and past
    loadBookings(): void {
        this.loading = true;

        this.bookingService
            .getUserBookings()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (bookings) => {
                    const now = new Date();

                    // Split bookings into categories
                    this.upcomingSessions = bookings.filter((booking) => booking.timeSlot && booking.timeSlot.startTime > now && booking.status !== 'cancelled').sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime());

                    this.completedSessions = bookings.filter((booking) => booking.status === 'completed').sort((a, b) => b.timeSlot!.startTime.getTime() - a.timeSlot!.startTime.getTime());

                    this.pastSessions = bookings
                        .filter((booking) => (booking.timeSlot && booking.timeSlot.startTime <= now && booking.status !== 'completed') || booking.status === 'cancelled')
                        .sort((a, b) => b.timeSlot!.startTime.getTime() - a.timeSlot!.startTime.getTime());

                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error loading bookings:', error);
                    this.sweetalertService.showToast(this.translateService.instant('Failed to load bookings'), 'error');
                    this.loading = false;
                }
            });
    }

    // Load dates that should be disabled in the datepicker
    loadDisabledDates(): void {
        const startDate = new Date();

        this.bookingService
            .getDisabledDates(startDate, 30)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (dates) => {
                    this.disabledDates = dates;
                },
                error: (error) => {
                    console.error('Error loading disabled dates:', error);
                }
            });
    }

    // When a date is selected in the booking dialog
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

                    // Filter available slots and map for dropdown
                    this.availableTimeSlots = slots
                        .filter((slot) => !slot.isBooked)
                        .map((slot) => ({
                            ...slot,
                            displayLabel: `${this.formatTime(slot.startTime)} - ${this.formatTime(slot.endTime)}`
                        }));
                },
                error: (error) => {
                    this.loadingTimeSlots = false;
                    console.error('Error loading time slots:', error);
                    this.sweetalertService.showToast(this.translateService.instant('Failed to load time slots'), 'error');
                }
            });
    }

    // Submit booking with Zoom meeting
    async submitBookingWithZoom(): Promise<void> {
        if (!this.selectedTimeSlot) {
            this.sweetalertService.showToast(this.translateService.instant('Please select a time slot'), 'warning');
            return;
        }

        this.isSubmitting = true;

        try {
            // Book the time slot with Zoom meeting
            await this.bookingService.bookTimeSlotWithAutoAssignAndZoom(this.selectedTimeSlot.id!, this.bookingNotes);

            this.sweetalertService.showToast(this.translateService.instant('Session booked successfully with Zoom meeting'), 'success');

            this.showBookingDialog = false;
            this.loadBookings();
            this.resetForm();
        } catch (error) {
            console.error('Error submitting booking:', error);
            this.sweetalertService.showToast(this.translateService.instant('Failed to book session'), 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    // View session details
    viewSessionDetails(session: Booking): void {
        this.selectedSession = session;
        this.activeSessionTab = 0; // Set to details tab
        this.showZoomMeetingDialog = true;
    }

    // Join Zoom meeting
    joinZoomMeeting(session: Booking): void {
        if (!session.zoomMeeting) {
            this.sweetalertService.showToast(this.translateService.instant('No Zoom meeting available for this session'), 'error');
            return;
        }

        this.zoomService
            .joinMeeting(session.zoomMeeting.meetingNumber, session.zoomMeeting.password, session.userName || 'User')
            .then(() => {
                this.sweetalertService.showToast(this.translateService.instant('Joined Zoom meeting successfully'), 'success');
            })
            .catch((error) => {
                console.error('Error joining Zoom meeting:', error);
                this.sweetalertService.showToast(this.translateService.instant('Failed to join Zoom meeting'), 'error');
            });

        this.selectedSession = session;
        this.activeSessionTab = 1; // Set to Zoom tab
        this.showZoomMeetingDialog = true;
    }

    // Confirm session cancellation
    confirmCancelSession(session: Booking): void {
        this.sessionToCancel = session;
        this.showCancelDialog = true;
    }

    // Cancel session
    async cancelSession(): Promise<void> {
        if (!this.sessionToCancel || !this.sessionToCancel.timeSlotId) return;

        this.isCancelling = true;

        try {
            await this.bookingService.cancelBookingWithZoom(this.sessionToCancel.id!, this.sessionToCancel.timeSlotId);

            this.sweetalertService.showToast(this.translateService.instant('Session cancelled successfully'), 'success');

            this.loadBookings();
        } catch (error) {
            console.error('Error cancelling session:', error);
            this.sweetalertService.showToast(this.translateService.instant('Failed to cancel session'), 'error');
        } finally {
            this.showCancelDialog = false;
            this.sessionToCancel = null;
            this.isCancelling = false;
        }
    }

    // Check if session can be modified (24 hours before start)
    canModifySession(session: Booking): boolean {
        if (!session.timeSlot || session.status === 'cancelled') return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const timeDiff = sessionStart.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // Allow modification only if session is at least 24 hours away
        return hoursDiff >= 24;
    }

    // Check if session is upcoming
    isSessionUpcoming(session: Booking): boolean {
        if (!session.timeSlot) return false;

        const now = new Date();
        return session.timeSlot.startTime > now && session.status !== 'cancelled';
    }

    // Check if session is happening soon (within next hour)
    isSessionSoon(session: Booking): boolean {
        if (!session.timeSlot) return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const timeDiff = sessionStart.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        return hoursDiff > 0 && hoursDiff <= 1;
    }

    // Check if session is in progress
    isSessionInProgress(session: Booking): boolean {
        if (!session.timeSlot) return false;

        const now = new Date();
        return session.timeSlot.startTime <= now && session.timeSlot.endTime >= now && session.status !== 'cancelled';
    }

    // Format time for display
    formatTime(date?: Date): string {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Format date for display
    formatDate(date?: Date): string {
        if (!date) return '';
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Get severity for status badge
    getStatusSeverity(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'danger';
            case 'completed':
                return 'info';
            default:
                return 'info';
        }
    }

    // Reset booking form
    resetForm(): void {
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingNotes = '';
        this.availableTimeSlots = [];
    }

    // Zoom meeting callbacks
    onZoomMeetingJoined(): void {
        this.envService.logDev('Zoom meeting joined');
    }

    onZoomMeetingEnded(): void {
        this.envService.logDev('Zoom meeting ended');
        this.showZoomMeetingDialog = false;
    }
}
