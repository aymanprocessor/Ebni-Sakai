// src/app/dashboard/components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

import { Observable, map } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { UserProfile } from '../../models/user.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, ChartModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    user$: Observable<UserProfile | null>;
    upcomingBookings$: Observable<Booking[]>;
    isAdmin$: Observable<boolean>;

    bookingChartData: any;
    bookingChartOptions: any;

    constructor(
        private authService: AuthService,
        private bookingService: BookingService
    ) {
        this.user$ = this.authService.currentUser$;
        this.isAdmin$ = this.authService.isAdmin();
        this.upcomingBookings$ = this.bookingService.getUserBookings().pipe(
            map((bookings) =>
                bookings
                    .filter((booking) => booking.status === 'confirmed' && booking.timeSlot && booking.timeSlot.startTime > new Date())
                    .sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime())
                    .slice(0, 3)
            )
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
        // if (confirm('Are you sure you want to cancel this booking?')) {
        //     this.bookingService
        //         .cancelBooking(booking.id)
        //         .then(() => {
        //             // The subscription will automatically update the view
        //             console.log('Booking cancelled successfully');
        //         })
        //         .catch((error) => {
        //             console.error('Error cancelling booking:', error);
        //         });
        // }
    }
}
