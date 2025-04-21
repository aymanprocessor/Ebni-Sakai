// src/app/booking/components/booking-calendar/booking-calendar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';

import { BookingService } from '../../../services/booking.service';
import { TimeSlot } from '../../../models/time-slot.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-booking-calendar',
    standalone: true,
    imports: [CommonModule, TranslateModule, DatePickerModule, TextareaModule, FormsModule, ReactiveFormsModule, SelectButtonModule, CalendarModule, DialogModule, ButtonModule, ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './booking-calendar.component.html'
})
export class BookingCalendarComponent implements OnInit, OnDestroy {
    availableTimeSlots: TimeSlot[] = [];
    filteredTimeSlots: TimeSlot[] = [];
    selectedDate: Date = new Date();
    dayFormattedDate = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', weekday: 'long', month: 'long', year: 'numeric' }).format(this.selectedDate);
    monthFormattedDate = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(this.selectedDate);

    selectedTimeSlot: TimeSlot | null = null;

    bookingDialog: boolean = false;
    bookingNotes: string = '';
    isLoading: boolean = false;

    viewOptions: any = [];
    selectedView: string = 'day';

    private subscriptions: Subscription = new Subscription();

    constructor(
        private bookingService: BookingService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private translateService: TranslateService
    ) {}

    ngOnInit(): void {
        this.loadTimeSlots();
        this.initViewOptions();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
    initViewOptions(): void {
        this.viewOptions = [
            { label: this.translateService.instant('common.labels.day'), value: 'day' },
            { label: this.translateService.instant('common.labels.week'), value: 'week' },
            { label: this.translateService.instant('common.labels.month'), value: 'month' }
        ];
    }
    loadTimeSlots(): void {
        this.isLoading = true;
        const sub = this.bookingService.getAvailableTimeSlots().subscribe({
            next: (timeSlots) => {
                this.availableTimeSlots = timeSlots;
                this.filterTimeSlotsByDate();
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

    onDateSelect(): void {
        this.filterTimeSlotsByDate();
    }

    onViewChange(): void {
        this.filterTimeSlotsByDate();
    }

    filterTimeSlotsByDate(): void {
        if (!this.selectedDate) {
            this.filteredTimeSlots = [...this.availableTimeSlots];
            return;
        }

        const selectedDateStart = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate(), 0, 0, 0);

        let selectedDateEnd: Date;

        switch (this.selectedView) {
            case 'day':
                selectedDateEnd = new Date(selectedDateStart);
                selectedDateEnd.setHours(23, 59, 59);
                break;
            case 'week':
                // Start of week (Sunday)
                const dayOfWeek = selectedDateStart.getDay();
                const diff = selectedDateStart.getDate() - dayOfWeek;
                selectedDateStart.setDate(diff);

                // End of week (Saturday)
                selectedDateEnd = new Date(selectedDateStart);
                selectedDateEnd.setDate(selectedDateStart.getDate() + 6);
                selectedDateEnd.setHours(23, 59, 59);
                break;
            case 'month':
                // Start of month
                selectedDateStart.setDate(1);

                // End of month
                selectedDateEnd = new Date(selectedDateStart.getFullYear(), selectedDateStart.getMonth() + 1, 0, 23, 59, 59);
                break;
            default:
                selectedDateEnd = new Date(selectedDateStart);
                selectedDateEnd.setHours(23, 59, 59);
        }

        this.filteredTimeSlots = this.availableTimeSlots.filter((timeSlot) => {
            return timeSlot.startTime >= selectedDateStart && timeSlot.startTime <= selectedDateEnd;
        });
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

    formatTimeSlot(timeSlot: TimeSlot): string {
        return `${this.formatTime(timeSlot.startTime)} - ${this.formatTime(timeSlot.endTime)}`;
    }

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString();
    }

    closeDialog(): void {
        this.bookingDialog = false;
        this.selectedTimeSlot = null;
    }

    getGroupedByDay(timeSlots: TimeSlot[]): { date: Date; slots: TimeSlot[] }[] {
        const grouped = timeSlots.reduce(
            (acc, slot) => {
                const dateStr = slot.startTime.toDateString();

                if (!acc[dateStr]) {
                    acc[dateStr] = {
                        date: new Date(slot.startTime),
                        slots: []
                    };
                }

                acc[dateStr].slots.push(slot);
                return acc;
            },
            {} as Record<string, { date: Date; slots: TimeSlot[] }>
        );

        // Convert object to array and sort by date
        return Object.values(grouped).sort((a, b) => a.date.getTime() - b.date.getTime());
    }
}
