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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { Logger } from '../../../services/logger.service';

interface DateOption {
    date: Date;
    displayLabel: string;
}

@Component({
    selector: 'app-session-booking',
    standalone: true,
    imports: [
        SharedModule,
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
    upcomingSessions: Booking[] | null = null;
    currentSessions: Booking[] = [];
    completedSessions: Booking[] = [];

    // Time slots data
    availableDates: DateOption[] = [];
    availableTimeSlots: any[] = [];
    selectedDate: DateOption | null = null;
    selectedTimeSlot: TimeSlot | null = null;
    bookingNotes: string = '';

    // UI state
    loading: boolean = true;
    bookingLoaded: boolean = false;
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

    currentDateTime: Date = new Date();
    private destroy$ = new Subject<void>();

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private translateService: TranslateService,
        private envService: EnvironmentService,
        private zoomService: ZoomService,
        private router: Router,
        private sweetalertService: SweetalertService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadBookings();
        this.loadAvailableDates();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Load all bookings and split into upcoming, current, and completed
    loadBookings(): void {
        this.loading = true;
        this.cdr.detectChanges();

        Logger.log('Loading bookings...');
        this.bookingService
            .getUserBookings()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (bookings) => {
                    const now = new Date();

                    // Split bookings into categories
                    this.upcomingSessions = bookings.filter((booking) => booking.timeSlot && booking.timeSlot.startTime > now && booking.status !== 'cancelled').sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime());

                    // Current sessions are those happening right now
                    this.currentSessions = bookings.filter((booking) => booking.timeSlot && this.isSessionTimeNow(booking));

                    this.completedSessions = bookings.filter((booking) => booking.status === 'completed').sort((a, b) => b.timeSlot!.startTime.getTime() - a.timeSlot!.startTime.getTime());
                    Logger.log('upcomingSessions loaded:', this.upcomingSessions);
                    Logger.log('currentSessions loaded:', this.currentSessions);
                    Logger.log('completedSessions loaded:', this.completedSessions);

                    this.loading = false;
                    this.bookingLoaded = true;
                    this.cdr.detectChanges();
                },
                error: (error) => {
                    console.error('Error loading bookings:', error);
                    this.sweetalertService.showToast(this.translateService.instant('common.messages.failedToLoadBookings'), 'error');
                    this.loading = false;
                    this.bookingLoaded = false;
                }
            });
    }

    // Check if session time equals current time
    isSessionTimeNow(session: Booking): boolean {
        if (!session.timeSlot) return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const sessionEnd = session.timeSlot.endTime;

        // Check if current time is between start and end time of the session
        return now >= sessionStart && now <= sessionEnd;
    }

    // Load available dates for dropdown
    loadAvailableDates(): void {
        const startDate = new Date();
        const daysToFetch = 30;

        this.bookingService
            .getAvailableDates(startDate, daysToFetch)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (dates) => {
                    this.availableDates = dates.map((date) => ({
                        date: date,
                        displayLabel: this.formatDateForDisplay(date)
                    }));
                },
                error: (error) => {
                    console.error('Error loading available dates:', error);
                    this.sweetalertService.showToast(this.translateService.instant('common.messages.failedToLoadAvailableDates'), 'error');
                }
            });
    }

    // Format date for display in dropdown
    formatDateForDisplay(date: Date): string {
        return date.toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // When a date is selected in the booking dialog
    onDateSelect(): void {
        if (!this.selectedDate) return;

        this.loadingTimeSlots = true;
        this.selectedTimeSlot = null;

        const startOfDay = new Date(this.selectedDate.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(this.selectedDate.date);
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
                    this.sweetalertService.showToast(this.translateService.instant('common.messages.failedToLoadTimeSlots'), 'error');
                }
            });
    }

    // Submit booking with Zoom meeting
    async submitBookingWithZoom(): Promise<void> {
        if (!this.selectedTimeSlot) {
            this.sweetalertService.showToast(this.translateService.instant('common.messages.pleaseSelectTimeSlot'), 'warning');
            return;
        }

        this.isSubmitting = true;

        try {
            // Book the time slot with Zoom meeting
            await this.bookingService.bookTimeSlotWithAutoAssignAndZoom(this.selectedTimeSlot.id!, this.bookingNotes);

            this.sweetalertService.showToast(this.translateService.instant('common.messages.sessionBookedSuccessfully'), 'success');

            this.showBookingDialog = false;
            this.loadBookings();
            this.resetForm();
        } catch (error) {
            console.error('Error submitting booking:', error);
            this.sweetalertService.showToast(this.translateService.instant('common.messages.failedToBookSession'), 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    // View session details
    viewSessionDetails(session: Booking): void {
        this.selectedSession = session;
        this.activeSessionTab = 0; // Set to details tab
        this.showZoomMeetingDialog = true;
        this.cdr.markForCheck();
    }

    // Join Zoom meeting
    joinZoomMeeting(session: Booking): void {
        if (!session.zoomMeeting) {
            this.sweetalertService.showToast(this.translateService.instant('pages.session.noMeetingAvailable'), 'error');
            return;
        }
        this.zoomService.openZoomMeetingInNewTab(session.zoomMeeting.meetingNumber, session.zoomMeeting.password, session.userName || 'User', this.zoomService.isCurrentUserHost(session));
    }

    // Confirm session cancellation
    confirmCancelSession(session: Booking): void {
        this.sessionToCancel = session;
        this.showCancelDialog = true;
        this.cdr.detectChanges();
    }

    // Cancel session
    async cancelSession(): Promise<void> {
        if (!this.sessionToCancel || !this.sessionToCancel.timeSlotId) return;

        this.isCancelling = true;

        try {
            await this.bookingService.cancelBookingWithZoom(this.sessionToCancel.id!, this.sessionToCancel.timeSlotId);

            this.sweetalertService.showToast(this.translateService.instant('pages.session.bookingCancelled'), 'success');

            this.loadBookings();
        } catch (error) {
            console.error('Error cancelling session:', error);
            this.sweetalertService.showToast(this.translateService.instant('pages.session.bookingFailed'), 'error');
        } finally {
            this.showCancelDialog = false;
            this.sessionToCancel = null;
            this.isCancelling = false;
            this.cdr.detectChanges();
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

    // Check if session is happening soon (within next hour)
    isSessionSoon(session: Booking): boolean {
        if (!session.timeSlot) return false;

        const now = new Date();
        const sessionStart = session.timeSlot.startTime;
        const timeDiff = sessionStart.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        return hoursDiff > 0 && hoursDiff <= 1;
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
        this.cdr.markForCheck();
    }

    hideCancelDialog() {
        this.showCancelDialog = false;
        this.cdr.markForCheck();
    }
}
