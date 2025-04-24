import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { BookingService } from '../../../services/booking.service';
import { TimeSlot } from '../../../models/time-slot.model';

interface DateColumn {
    date: Date;
    dayName: string;
    dateFormatted: string;
    isToday: boolean;
    isNextDay: boolean;
    isNextWeek: boolean;
    timeSlots: TimeSlot[];
}

@Component({
    selector: 'app-time-slots-calendar',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, ButtonModule, DialogModule, ToastModule, ConfirmDialogModule, TextareaModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './time-slots-calendar.component.html'
})
export class TimeSlotsCalendarComponent implements OnInit, OnDestroy {
    dateColumns: DateColumn[] = [];
    allTimeSlots: TimeSlot[] = [];
    selectedTimeSlot: TimeSlot | null = null;
    bookingDialog: boolean = false;
    bookingNotes: string = '';
    isLoading: boolean = false;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadTimeSlots();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadTimeSlots(): void {
        this.isLoading = true;
        const sub = this.bookingService.getAvailableTimeSlots().subscribe({
            next: (timeSlots) => {
                this.allTimeSlots = timeSlots;
                this.initializeDateColumns();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading time slots:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load available time slots.'
                });
                this.isLoading = false;
            }
        });

        this.subscriptions.add(sub);
    }

    initializeDateColumns(): void {
        // Clear existing columns
        this.dateColumns = [];

        // Create columns for next 5 days (today, tomorrow, next 3 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            const isToday = i === 0;
            const isNextDay = i === 1;
            const isNextWeek = this.isInNextWeek(date, today);

            this.dateColumns.push({
                date: date,
                dayName: this.getDayName(date),
                dateFormatted: this.formatDate(date),
                isToday,
                isNextDay,
                isNextWeek,
                timeSlots: this.getTimeSlotsForDate(date)
            });
        }
    }

    isInNextWeek(date: Date, today: Date): boolean {
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

        return date >= nextWeekStart && date <= nextWeekEnd;
    }

    getDayName(date: Date): string {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    formatDate(date: Date): string {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    getTimeSlotsForDate(date: Date): TimeSlot[] {
        return this.allTimeSlots
            .filter((slot) => {
                const slotDate = new Date(slot.startTime);
                return slotDate.getDate() === date.getDate() && slotDate.getMonth() === date.getMonth() && slotDate.getFullYear() === date.getFullYear();
            })
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }

    formatTimeOnly(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    selectTimeSlot(timeSlot: TimeSlot): void {
        this.selectedTimeSlot = timeSlot;
        this.bookingNotes = '';
        this.bookingDialog = true;
    }

    bookTimeSlot(): void {
        if (!this.selectedTimeSlot) {
            return;
        }

        this.isLoading = true;
        this.bookingService
            .bookTimeSlot(this.selectedTimeSlot.id, this.bookingNotes)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Booking Confirmed',
                    detail: 'Your time slot has been successfully booked.'
                });
                this.bookingDialog = false;
                this.selectedTimeSlot = null;
                this.isLoading = false;
                this.loadTimeSlots(); // Refresh the list
            })
            .catch((error) => {
                console.error('Error booking time slot:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Booking Failed',
                    detail: error.message || 'Failed to book the time slot. Please try again.'
                });
                this.isLoading = false;
            });
    }

    closeDialog(): void {
        this.bookingDialog = false;
        this.selectedTimeSlot = null;
    }
}
