import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { SkeletonModule } from 'primeng/skeleton';
import { ZoomMeetingComponent } from '../zoom-meetings/zoom-meetings.component';
import { ZoomService } from '../../services/zoom.service';
import { SweetalertService } from '../../services/sweetalert.service';

@Component({
    selector: 'app-specialist-bookings',
    standalone: true,
    imports: [CommonModule, SkeletonModule, TableModule, CardModule, ButtonModule, TagModule, ToastModule, DialogModule, TranslateModule, TabViewModule, ZoomMeetingComponent, TooltipModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './specialist-bookings.component.html'
})
export class SpecialistBookingsComponent implements OnInit, OnDestroy {
    bookings: Booking[] = [];
    pendingBookings: Booking[] = [];
    confirmedBookings: Booking[] = [];
    completedBookings: Booking[] = [];
    loading: boolean = true;
    selectedBooking: Booking | null = null;
    showDetailsDialog: boolean = false;
    showZoomMeetingDialog: boolean = false;
    activeBookingTab: number = 0;
    subscriptions: Subscription = new Subscription();

    constructor(
        private bookingService: BookingService,
        private authService: AuthService,
        private translateService: TranslateService,
        private zoomService: ZoomService,
        private sweetalertService: SweetalertService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadSpecialistBookings();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadSpecialistBookings(): void {
        this.loading = true;

        // Get bookings assigned to the current specialist
        const sub = this.authService.currentUser$.subscribe((user) => {
            if (user?.role === 'specialist') {
                // Using the specialist bookings method to get bookings for this specialist
                this.subscriptions.add(
                    this.bookingService.getSpecialistBookings().subscribe({
                        next: (bookings) => {
                            this.bookings = bookings.sort((a, b) => {
                                // Sort by start time
                                if (a.timeSlot && b.timeSlot) {
                                    return a.timeSlot.startTime.getTime() - b.timeSlot.startTime.getTime();
                                }
                                return 0;
                            });
                            this.categorizeBookings(this.bookings);
                            this.loading = false;
                        },
                        error: (error) => {
                            console.error('Error loading bookings:', error);
                            this.sweetalertService.showToast('Failed to load bookings.', 'error');
                            this.loading = false;
                        }
                    })
                );
            }
        });

        this.subscriptions.add(sub);
    }

    categorizeBookings(bookings: Booking[]): void {
        this.pendingBookings = bookings.filter((booking) => booking.status === 'pending');
        this.confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
        this.completedBookings = bookings.filter((booking) => booking.status === 'completed');
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'confirmed':
                return 'success';
            case 'completed':
                return 'info';
            case 'cancelled':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    viewBookingDetails(booking: Booking): void {
        this.selectedBooking = booking;
        this.activeBookingTab = 0; // Set to details tab
        this.showDetailsDialog = true;
        this.cdr.markForCheck();
    }

    viewZoomMeeting(booking: Booking): void {
        if (!booking.zoomMeeting) {
            this.sweetalertService.showToast('No Zoom meeting available for this booking', 'error');
            return;
        }

        // Open Zoom meeting in new tab
        const currentUser = this.authService.getCurrentUser();
        const isHost = booking.assignedSpecialistId === currentUser?.uid;

        // Open Zoom meeting in new tab with correct host parameter
        this.zoomService.openZoomMeetingInNewTab(booking.zoomMeeting.meetingNumber, booking.zoomMeeting.password, currentUser?.displayName || 'Unknown', isHost);
    }

    confirmBooking(booking: Booking): void {
        this.sweetalertService.showConfirmation(
            this.translateService.instant('Are you sure you want to confirm this booking?'),
            () => {
                this.bookingService
                    .confirmBooking(booking.id!)
                    .then(() => {
                        this.sweetalertService.showToast('Booking confirmed successfully.', 'success');
                        this.loadSpecialistBookings();
                    })
                    .catch((error) => {
                        console.error('Error confirming booking:', error);
                        this.sweetalertService.showToast('Failed to confirm booking.', 'error');
                    });
            },
            this.translateService.instant('Confirm')
        );
    }

    cancelBooking(booking: Booking): void {
        this.sweetalertService.showConfirmation(
            this.translateService.instant('Are you sure you want to cancel this booking?'),
            () => {
                if (booking.timeSlotId) {
                    this.bookingService
                        .cancelBookingWithZoom(booking.id!, booking.timeSlotId)
                        .then(() => {
                            this.sweetalertService.showToast('Booking cancelled successfully.', 'success');
                            this.loadSpecialistBookings();
                        })
                        .catch((error) => {
                            console.error('Error cancelling booking:', error);
                            this.sweetalertService.showToast('Failed to cancel booking.', 'error');
                        });
                }
            },
            this.translateService.instant('Cancel Booking')
        );
    }

    completeBooking(booking: Booking): void {
        this.sweetalertService.showConfirmation(
            this.translateService.instant('Mark this booking as completed?'),
            () => {
                this.bookingService
                    .completeBooking(booking.id!)
                    .then(() => {
                        this.sweetalertService.showToast('Booking completed successfully.', 'success');
                        this.loadSpecialistBookings();
                    })
                    .catch((error) => {
                        console.error('Error completing booking:', error);
                        this.sweetalertService.showToast('Failed to complete booking.', 'error');
                    });
            },
            this.translateService.instant('Complete Booking')
        );
    }

    onZoomMeetingJoined(): void {
        // Implement zoom meeting joined logic
        this.sweetalertService.showToast('Zoom meeting joined successfully.', 'success');
    }

    onZoomMeetingEnded(): void {
        // Implement zoom meeting ended logic
        this.sweetalertService.showToast('Zoom meeting ended.', 'info');
    }
}
