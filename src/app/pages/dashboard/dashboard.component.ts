// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { Observable, map, of, switchMap } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { UserProfile } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, ChartModule, TagModule, TranslateModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    user$: Observable<UserProfile | null>;
    upcomingBookings$: Observable<Booking[]>;
    isAdmin$: Observable<boolean>;
    isSpecialist$: Observable<boolean>;
    isUser$: Observable<boolean>;

    bookingChartData: any;
    bookingChartOptions: any;

    constructor(
        private authService: AuthService,
        private bookingService: BookingService
    ) {
        this.user$ = this.authService.currentUser$;
        this.isAdmin$ = this.authService.isAdmin();
        this.isSpecialist$ = this.user$.pipe(map((user) => user?.role === 'specialist'));
        this.isUser$ = this.user$.pipe(map((user) => user?.role === 'user'));

        // Load upcoming bookings based on user role
        this.upcomingBookings$ = this.user$.pipe(
            map((user) => {
                if (!user) return of([]);

                if (user.role === 'specialist') {
                    // For specialists, show their assigned bookings
                    return this.bookingService.getSpecialistBookings().pipe(
                        map(
                            (bookings) =>
                                bookings
                                    .filter((booking) => booking.status === 'confirmed' && booking.timeSlot && booking.timeSlot.startTime > new Date())
                                    .sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime())
                                    .slice(0, 5) // Show first 5 upcoming bookings
                        )
                    );
                } else if (user.role === 'user') {
                    // For regular users, show their bookings
                    return this.bookingService.getUserBookings().pipe(
                        map((bookings) =>
                            bookings
                                .filter((booking) => booking.status === 'confirmed' && booking.timeSlot && booking.timeSlot.startTime > new Date())
                                .sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime())
                                .slice(0, 5)
                        )
                    );
                }

                return of([]);
            }),
            switchMap((obs) => obs)
        );
    }

    ngOnInit(): void {
        this.initCharts();
    }

    private initCharts(): void {
        // Sample chart data - in a real app, this would come from a service
        this.bookingChartData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'Bookings',
                    data: [12, 19, 3, 5, 2, 3, 9],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };

        this.bookingChartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef'
                    }
                }
            }
        };
    }

    formatDateTime(date: Date): string {
        return date.toLocaleString([], {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    cancelBooking(booking: Booking): void {
        if (confirm('Are you sure you want to cancel this booking?')) {
            this.bookingService
                .cancelBookingWithZoom(booking.id!, booking.timeSlotId)
                .then(() => {
                    // The subscription will automatically update the view
                    console.log('Booking cancelled successfully');
                })
                .catch((error) => {
                    console.error('Error cancelling booking:', error);
                });
        }
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'danger';
            default:
                return 'info';
        }
    }
}
