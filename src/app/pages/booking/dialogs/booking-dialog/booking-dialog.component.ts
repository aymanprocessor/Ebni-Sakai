// booking-dialog.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TranslateModule } from '@ngx-translate/core';

interface TimeSlot {
    label: string;
    value: string;
}

interface DateInfo {
    day: number;
    month: string;
    weekday: string;
    active: boolean;
    slots: number;
    slotColor?: string;
}

@Component({
    selector: 'app-booking-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, CalendarModule, DropdownModule, TranslateModule],
    templateUrl: './booking-dialog.component.html',
    styleUrls: ['./booking-dialog.component.scss']
})
export class BookingDialogComponent implements OnInit {
    visible = false;
    selectedDate: Date = new Date();
    selectedTimeZone = 'Europe/Amsterdam';
    selectedTimeSlot: string | null = null;

    weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    currentMonth = 'Sep';
    dates: DateInfo[] = [
        { day: 11, month: 'Sep', weekday: 'Mon', active: true, slots: 7, slotColor: 'green' },
        { day: 12, month: 'Sep', weekday: 'Tue', active: true, slots: 1, slotColor: 'yellow' },
        { day: 13, month: 'Sep', weekday: 'Wed', active: false, slots: 0, slotColor: '' },
        { day: 14, month: 'Sep', weekday: 'Thu', active: false, slots: 0, slotColor: '' },
        { day: 15, month: 'Sep', weekday: 'Fri', active: true, slots: 3, slotColor: 'green' }
    ];

    timeSlots: TimeSlot[] = [
        { label: '7:30 AM', value: '07:30' },
        { label: '8:30 AM', value: '08:30' },
        { label: '9:00 AM', value: '09:00' },
        { label: '9:30 AM', value: '09:30' },
        { label: '10:30 AM', value: '10:30' },
        { label: '11:30 AM', value: '11:30' }
    ];

    timezones = [{ label: 'Europe/Amsterdam Time (20:05)', value: 'Europe/Amsterdam' }];

    constructor() {}

    ngOnInit(): void {}

    show(): void {
        this.visible = true;
    }

    hide(): void {
        this.visible = false;
    }

    selectDate(date: any): void {
        this.dates.forEach((d) => {
            if (d.day === date.day) {
                // We're just selecting the date, not toggling active state
                this.selectedDate = new Date(2023, 8, date.day); // September is month 8 (0-indexed)
            }
        });
    }

    selectTimeSlot(slot: string): void {
        this.selectedTimeSlot = slot;
    }

    nextWeek(): void {
        // Implementation for navigation would go here
    }

    prevWeek(): void {
        // Implementation for navigation would go here
    }

    confirmBooking(): void {
        if (this.selectedTimeSlot) {
            // Handle booking confirmation
            console.log('Booking confirmed:', {
                date: this.selectedDate,
                timeSlot: this.selectedTimeSlot,
                timezone: this.selectedTimeZone
            });
            this.hide();
        }
    }

    isDateActive(date: any): boolean {
        return date.active;
    }

    isDateSelected(date: any): boolean {
        return this.selectedDate && this.selectedDate.getDate() === date.day;
    }
}
