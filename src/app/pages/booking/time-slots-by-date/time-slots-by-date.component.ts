import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { BookingService } from '../../../services/booking.service';
import { TimeSlot } from '../../../models/time-slot.model';

@Component({
    selector: 'app-time-slots-by-date',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, SelectButtonModule, ButtonModule, DialogModule, CardModule, ToastModule, ConfirmDialogModule, TextareaModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './time-slots-by-date.component.html'
})
export class TimeSlotsByDateComponent implements OnInit, OnDestroy {
    groupedTimeSlots: { date: string; slots: TimeSlot[] }[] = [];
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
        this.loadGroupedTimeSlots();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadGroupedTimeSlots(): void {
        this.isLoading = true;
        const sub = this.bookingService.getAvailableSlotsGroupedByDate().subscribe({
            next: (groupedSlots) => {
                this.groupedTimeSlots = groupedSlots;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading grouped time slots:', error);
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
                this.loadGroupedTimeSlots(); // Refresh the list
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

    formatTime(date: Date): string {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString();
    }

    formatDateWithLocale(date: string, locale: 'en' | 'ar'): string {
        const dateObj = new Date(date);
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', options);
    }

    closeDialog(): void {
        this.bookingDialog = false;
        this.selectedTimeSlot = null;
    }
}
