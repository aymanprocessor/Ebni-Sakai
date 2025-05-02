// src/app/pages/specialist-bookings/specialist-bookings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { SkeletonModule } from 'primeng/skeleton';
import { ZoomMeetingComponent } from '../zoom-meetings/zoom-meetings.component';
import { ZoomService } from '../../services/zoom.service';
import { Logger } from '../../services/logger.service';

@Component({
    selector: 'app-specialist-bookings',
    standalone: true,
    imports: [CommonModule, SkeletonModule, TableModule, CardModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, DialogModule, TranslateModule, TabViewModule, ZoomMeetingComponent],
    providers: [MessageService, ConfirmationService],
    templateUrl: './specialist-bookings.component.html'
})
export class SpecialistBookingsComponent implements OnInit, OnDestroy {
    bookings: Booking[] = [];
    loading: boolean = true;
    selectedBooking: Booking | null = null;
    showDetailsDialog: boolean = false;
    showZoomMeetingDialog: boolean = false;
    activeBookingTab: number = 0;
    subscriptions: Subscription = new Subscription();

    constructor(
        private bookingService: BookingService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private zoomService: ZoomService
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
                            this.loading = false;
                        },
                        error: (error) => {
                            console.error('Error loading bookings:', error);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to load bookings.'
                            });
                            this.loading = false;
                        }
                    })
                );
            }
        });

        this.subscriptions.add(sub);
    }

    viewBookingDetails(booking: Booking): void {
        this.selectedBooking = booking;
        this.activeBookingTab = 0; // Set to details tab
        this.showDetailsDialog = true;
    }

    viewZoomMeeting(booking: Booking): void {
        // this.selectedBooking = booking;
        // this.activeBookingTab = 1; // Set to Zoom tab
        // this.showDetailsDialog = true;

        if (!booking.zoomMeeting) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No Zoom meeting available for this booking'
            });
            return;
        }

        // Open Zoom meeting in new tab
        const currentUser = this.authService.getCurrentUser();
        const isHost = booking.assignedSpecialistId === currentUser?.uid;

        // Open Zoom meeting in new tab with correct host parameter
        this.zoomService.openZoomMeetingInNewTab(booking.zoomMeeting.meetingNumber, booking.zoomMeeting.password, currentUser?.displayName || 'Unknown', isHost);
    }

    confirmBooking(booking: Booking): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to confirm this booking?',
            header: 'Confirm',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.bookingService
                    .confirmBooking(booking.id!)
                    .then(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Booking confirmed successfully.'
                        });
                        this.loadSpecialistBookings();
                    })
                    .catch((error) => {
                        console.error('Error confirming booking:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to confirm booking.'
                        });
                    });
            }
        });
    }

    cancelBooking(booking: Booking): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to cancel this booking?',
            header: 'Cancel Booking',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (booking.timeSlotId) {
                    this.bookingService
                        .cancelBookingWithZoom(booking.id!, booking.timeSlotId)
                        .then(() => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Booking cancelled successfully.'
                            });
                            this.loadSpecialistBookings();
                        })
                        .catch((error) => {
                            console.error('Error cancelling booking:', error);
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to cancel booking.'
                            });
                        });
                }
            }
        });
    }

    completeBooking(booking: Booking): void {
        this.confirmationService.confirm({
            message: 'Mark this booking as completed?',
            header: 'Complete Booking',
            icon: 'pi pi-check',
            accept: () => {
                this.bookingService
                    .completeBooking(booking.id!)
                    .then(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Booking completed successfully.'
                        });
                        this.loadSpecialistBookings();
                    })
                    .catch((error) => {
                        console.error('Error completing booking:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to complete booking.'
                        });
                    });
            }
        });
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warn';
            case 'cancelled':
                return 'danger';
            case 'completed':
                return 'info';
            default:
                return 'info';
        }
    }

    formatDateTime(date: Date): string {
        return date.toLocaleString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    isSessionUpcoming(booking: Booking): boolean {
        if (!booking.timeSlot) return false;

        const now = new Date();
        return booking.timeSlot.startTime > now && booking.status !== 'cancelled';
    }

    isSessionInProgress(booking: Booking): boolean {
        if (!booking.timeSlot) return false;

        const now = new Date();
        return booking.timeSlot.startTime <= now && booking.timeSlot.endTime >= now && booking.status !== 'cancelled';
    }

    onZoomMeetingJoined(): void {
        Logger.log('Zoom meeting joined');
    }

    onZoomMeetingEnded(): void {
        Logger.log('Zoom meeting ended');
        this.showDetailsDialog = false;
    }
}
