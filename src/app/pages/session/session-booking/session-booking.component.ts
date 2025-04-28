import { Booking } from './../../../models/booking.model';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { Subject, take, takeUntil } from 'rxjs';
import { TimeSlot } from '../../../models/time-slot.model';
import { BookingService } from '../../../services/booking.service';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';
import { UserManagementService } from '../../../services/user-management.service';
import { SelectModule } from 'primeng/select';

interface DateOption {
    label: string;
    value: Date;
}

@Component({
    selector: 'app-session-booking',
    standalone: true,
    imports: [SharedModule, CommonModule, FormsModule, SelectModule, TableModule, ButtonModule, DatePickerModule, DialogModule, ToastModule, DropdownModule, TextareaModule, TranslateModule, TooltipModule, SkeletonModule],
    providers: [MessageService],
    templateUrl: './session-booking.component.html',
    styleUrls: ['./session-booking.component.scss']
})
export class SessionBookingComponent implements OnInit, OnDestroy {
    sessions: Booking[] = [];
    availableTimeSlots: any[] = [];
    selectedDate: Date | null = null;
    selectedTimeSlot: TimeSlot | null = null;
    bookingNotes: string = '';
    showBookingDialog: boolean = false;
    showCancelDialog: boolean = false;
    editingSession: Booking | null = null;
    sessionToCancel: Booking | null = null;
    minDate: Date = new Date();
    loading: boolean = true;
    private destroy$ = new Subject<void>();
    availableDateOptions: DateOption[] = [];
    disabledDates: Date[] = [];

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private userManagementService: UserManagementService,
        private translate: TranslateService,
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
        this.bookingService
            .getAvailableTimeSlots()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (slots) => {
                    // Extract unique dates from available slots
                    const dateMap = new Map<string, Date>();

                    slots.forEach((slot) => {
                        const date = new Date(slot.startTime);
                        date.setHours(0, 0, 0, 0);
                        const dateKey = date.toDateString();
                        if (!dateMap.has(dateKey)) {
                            dateMap.set(dateKey, date);
                        }
                    });

                    // Convert to options array and sort
                    this.availableDateOptions = Array.from(dateMap.values())
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date) => ({
                            label: this.formatDateForDisplay(date),
                            value: date
                        }));
                },
                error: (error) => {
                    console.error('Error loading available dates:', error);
                }
            });
    }

    formatDateForDisplay(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString(localStorage.getItem('language')?.toString().split('-')[0], options);
    }

    // // Function to disable dates without available slots
    // disabledDates(date: Date): boolean {
    //     return !this.availableDates.some((availableDate) => availableDate.getFullYear() === date.getFullYear() && availableDate.getMonth() === date.getMonth() && availableDate.getDate() === date.getDate());
    // }

    onDateSelect(): void {
        if (!this.selectedDate) return;

        const startOfDay = new Date(this.selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(this.selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        this.bookingService
            .getTimeSlotsInRange(startOfDay, endOfDay)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (slots) => {
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
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load available time slots'
                    });
                    console.error('Error loading time slots:', error);
                }
            });
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
            // Find the least busy specialist
            const leastBusySpecialist = await this.findLeastBusySpecialist();

            if (!leastBusySpecialist) {
                // If no specialist found, book without assignment or show error
                const response = confirm('No specialists available. Would you like to book anyway?');
                if (!response) {
                    return;
                }

                // Book without specialist assignment
                await this.bookingService.bookTimeSlot(this.selectedTimeSlot.id!, this.bookingNotes);
            } else {
                // Book with specialist assignment
                await this.bookingService.bookTimeSlotWithSpecialist(this.selectedTimeSlot.id!, this.bookingNotes, leastBusySpecialist.uid);
            }

            this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Session booked successfully'
            });

            this.loadUserSessions();
            this.resetForm();
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to book session'
            });
            console.error('Error submitting booking:', error);
        }
    }
    private async findLeastBusySpecialist(): Promise<any> {
        try {
            // Get all users first to see what we're getting
            const users = await new Promise<any[]>((resolve, reject) => {
                this.userManagementService.getAllUsers().subscribe({
                    next: (users) => {
                        console.log('All users (raw):', JSON.stringify(users, null, 2));
                        console.log('Total users count:', users.length);
                        resolve(users);
                    },
                    error: (error) => {
                        console.error('Error fetching users:', error);
                        reject(error);
                    }
                });
            });

            // More robust specialist filtering with case-insensitivity
            const specialists = users.filter((user) => {
                const isSpecialist = user.role === 'specialist';

                return isSpecialist;
            });

            console.log('Found specialists:', JSON.stringify(specialists, null, 2));
            console.log('Specialists count:', specialists.length);

            if (specialists.length === 0) {
                console.error('No specialists found');
                return null;
            }

            // Get booking counts for each specialist
            const specialistWithCounts = await Promise.all(
                specialists.map(async (specialist) => {
                    const count = await new Promise<number>((resolve) => {
                        this.bookingService
                            .getSpecialistBookingCount(specialist.uid)
                            .pipe(take(1))
                            .subscribe({
                                next: (count) => {
                                    console.log(`Booking count for ${specialist.email}:`, count);
                                    resolve(count);
                                },
                                error: (error) => {
                                    console.error(`Error getting booking count for ${specialist.email}:`, error);
                                    resolve(0);
                                }
                            });
                    });
                    return { specialist, bookingCount: count };
                })
            );

            // Find specialist with least bookings
            const leastBusy = specialistWithCounts.reduce((prev, current) => (prev.bookingCount <= current.bookingCount ? prev : current));

            console.log('Selected specialist:', JSON.stringify(leastBusy.specialist, null, 2));
            return leastBusy.specialist;
        } catch (error) {
            console.error('Comprehensive error finding least busy specialist:', error);
            return null;
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

    resetForm(): void {
        this.showBookingDialog = false;
        this.selectedDate = null;
        this.selectedTimeSlot = null;
        this.bookingNotes = '';
        this.editingSession = null;
        this.availableTimeSlots = [];
    }
}
