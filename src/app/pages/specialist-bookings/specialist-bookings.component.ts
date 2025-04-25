// src/app/pages/specialist/specialist-bookings/specialist-bookings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-specialist-bookings',
    standalone: true,
    imports: [CommonModule, SkeletonModule, TableModule, CardModule, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, DialogModule, TranslateModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './specialist-bookings.component.html'
})
export class SpecialistBookingsComponent implements OnInit, OnDestroy {
    bookings: Booking[] = [];
    loading: boolean = true;
    selectedBooking: Booking | null = null;
    showDetailsDialog: boolean = false;
    subscriptions: Subscription = new Subscription();

    constructor(
        private bookingService: BookingService,
        private authService: AuthService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadSpecialistBookings();
    }

    loadSpecialistBookings(): void {
        this.loading = true;

        // Get current specialist user bookings
        const sub = this.authService.currentUser$.subscribe((user) => {
            if (user?.role === 'specialist') {
                // Using existing booking service method to get bookings for specialist
                this.subscriptions.add(
                    this.bookingService.getUserBookings().subscribe({
                        next: (bookings) => {
                            this.bookings = bookings.sort((a, b) => {
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
        this.showDetailsDialog = true;
    }

    confirmBooking(booking: Booking): void {
        this.confirmationService.confirm({
            message: 'Are you sure you want to confirm this booking?',
            header: 'Confirm',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.updateBookingStatus(booking.id, 'confirmed');
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
                        .cancelBooking(booking.id!, booking.timeSlotId)
                        .then(() => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: 'Booking cancelled successfully.'
                            });
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
                this.updateBookingStatus(booking.id, 'completed');
            }
        });
    }

    updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled' | 'completed'): void {
        // Add specific specialist booking update logic here
        // For now, using a basic message
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Booking ${status} successfully.`
        });
    }

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'panding':
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

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}
