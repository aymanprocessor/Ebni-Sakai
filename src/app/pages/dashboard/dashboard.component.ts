// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable, map, of, switchMap, combineLatest } from 'rxjs';
import { Booking } from '../../models/booking.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { UserProfile } from '../../models/user.model';
import { TranslateModule } from '@ngx-translate/core';

interface DashboardStats {
    totalSessions: number;
    completedSessions: number;
    upcomingSessions: number;
    pendingSessions: number;
    todaySessions: number;
    weekSessions: number;
}

interface ActivityItem {
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    time: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, ChartModule, TagModule, ProgressBarModule, AvatarModule, BadgeModule, SkeletonModule, TranslateModule],
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    user$: Observable<UserProfile | null>;
    upcomingBookings$: Observable<Booking[]>;
    isAdmin$: Observable<boolean>;
    isSpecialist$: Observable<boolean>;
    isUser$: Observable<boolean>;

    // Specialist specific observables
    stats$: Observable<DashboardStats>;
    todayBookings$: Observable<Booking[]>;
    recentActivity: ActivityItem[] = [];

    bookingChartData: any;
    bookingChartOptions: any;
    sessionsByTypeChart: any;
    sessionsByTypeOptions: any;

    currentTime = new Date();
    greeting = '';

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

        // Specialist stats
        this.stats$ = this.user$.pipe(
            switchMap((user) => {
                if (!user || user.role !== 'specialist') {
                    return of({
                        totalSessions: 0,
                        completedSessions: 0,
                        upcomingSessions: 0,
                        pendingSessions: 0,
                        todaySessions: 0,
                        weekSessions: 0
                    });
                }

                return this.bookingService.getSpecialistBookings().pipe(
                    map((bookings) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);

                        const weekStart = new Date(today);
                        weekStart.setDate(today.getDate() - today.getDay());
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekStart.getDate() + 7);

                        return {
                            totalSessions: bookings.length,
                            completedSessions: bookings.filter((b) => b.status === 'completed').length,
                            upcomingSessions: bookings.filter((b) => b.status === 'confirmed' && b.timeSlot && b.timeSlot.startTime > new Date()).length,
                            pendingSessions: bookings.filter((b) => b.status === 'pending').length,
                            todaySessions: bookings.filter((b) => b.timeSlot && b.timeSlot.startTime >= today && b.timeSlot.startTime < tomorrow).length,
                            weekSessions: bookings.filter((b) => b.timeSlot && b.timeSlot.startTime >= weekStart && b.timeSlot.startTime < weekEnd).length
                        };
                    })
                );
            })
        );

        // Today's bookings for specialist
        this.todayBookings$ = this.user$.pipe(
            switchMap((user) => {
                if (!user || user.role !== 'specialist') {
                    return of([]);
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                return this.bookingService
                    .getSpecialistBookings()
                    .pipe(map((bookings) => bookings.filter((b) => b.timeSlot && b.timeSlot.startTime >= today && b.timeSlot.startTime < tomorrow).sort((a, b) => a.timeSlot!.startTime.getTime() - b.timeSlot!.startTime.getTime())));
            })
        );
    }

    ngOnInit(): void {
        this.setGreeting();
        this.initCharts();
        this.loadRecentActivity();

        // Update time every minute
        setInterval(() => {
            this.currentTime = new Date();
        }, 60000);
    }

    private setGreeting(): void {
        const hour = new Date().getHours();
        if (hour < 12) {
            this.greeting = 'صباح الخير';
        } else if (hour < 18) {
            this.greeting = 'مساء الخير';
        } else {
            this.greeting = 'مساء الخير';
        }
    }

    private loadRecentActivity(): void {
        // Mock recent activity - in real app, fetch from service
        this.recentActivity = [
            {
                icon: 'pi-check-circle',
                iconColor: 'text-green-500',
                title: 'جلسة مكتملة',
                description: 'أكملت جلسة مع أحمد محمد',
                time: 'منذ ساعة'
            },
            {
                icon: 'pi-calendar-plus',
                iconColor: 'text-blue-500',
                title: 'جلسة جديدة',
                description: 'تم حجز جلسة جديدة مع سارة علي',
                time: 'منذ ساعتين'
            },
            {
                icon: 'pi-file-edit',
                iconColor: 'text-purple-500',
                title: 'تقييم مكتمل',
                description: 'تم إكمال تقييم لمقياس الذكاء',
                time: 'منذ 3 ساعات'
            }
        ];
    }

    private initCharts(): void {
        // Weekly sessions chart
        this.bookingChartData = {
            labels: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
            datasets: [
                {
                    label: 'الجلسات',
                    data: [5, 8, 6, 9, 7, 4, 3],
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8
                }
            ]
        };

        this.bookingChartOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    ticks: {
                        color: '#6B7280',
                        stepSize: 2
                    },
                    grid: {
                        color: '#E5E7EB'
                    }
                }
            }
        };

        // Sessions by type pie chart
        this.sessionsByTypeChart = {
            labels: ['تقييمات', 'ألعاب', 'مقاييس', 'استشارات'],
            datasets: [
                {
                    data: [35, 28, 22, 15],
                    backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EF4444'],
                    borderWidth: 0
                }
            ]
        };

        this.sessionsByTypeOptions = {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#6B7280',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        };
    }

    formatDateTime(date: Date): string {
        return date.toLocaleString('ar-EG', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    cancelBooking(booking: Booking): void {
        if (confirm('هل أنت متأكد من إلغاء هذه الجلسة؟')) {
            this.bookingService
                .cancelBookingWithZoom(booking.id!, booking.timeSlotId)
                .then(() => {
                    console.log('Booking cancelled successfully');
                })
                .catch((error) => {
                    console.error('Error cancelling booking:', error);
                });
        }
    }

    getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
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

    getCompletionPercentage(stats: DashboardStats): number {
        if (stats.totalSessions === 0) return 0;
        return Math.round((stats.completedSessions / stats.totalSessions) * 100);
    }

    // Compute duration in minutes between a booking's timeSlot start and end
    computeDurationMinutes(booking: Booking): number {
        const start = booking.timeSlot?.startTime;
        const end = booking.timeSlot?.endTime;
        if (!start || !end) return 0;
        const s = typeof start === 'string' ? new Date(start) : start;
        const e = typeof end === 'string' ? new Date(end) : end;
        return Math.round((e.getTime() - s.getTime()) / 60000);
    }
}
