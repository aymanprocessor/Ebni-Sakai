// src/app/booking/components/available-specialists/available-specialists.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Specialist } from '../../models/specialist.model';
import { BookingService } from '../../services/booking.service';
import { SpecialistService } from '../../services/specialist.service';

@Component({
    selector: 'app-available-specialists',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, DialogModule, CardModule, ToastModule, DatePickerModule, SelectModule, TranslateModule],
    providers: [MessageService],
    templateUrl: './available-specialists.component.html'
})
export class AvailableSpecialistsComponent implements OnInit {
    selectedDate: Date = new Date();
    selectedTime: string | null = null;
    specialists: Specialist[] = [];
    availableSpecialists: Specialist[] = [];
    loading: boolean = false;

    timeSlots: { label: string; value: string }[] = [];
    bookingConfirmDialog: boolean = false;
    selectedSpecialist: Specialist | null = null;
    bookingNotes: string = '';

    constructor(
        private specialistService: SpecialistService,
        private bookingService: BookingService,
        private messageService: MessageService,
        private translateService: TranslateService
    ) {}

    ngOnInit(): void {
        this.initTimeSlots();
        this.loadSpecialists();
    }

    private initTimeSlots(): void {
        // Generate time slots from 8 AM to 6 PM with 30-minute intervals
        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 18 && minute === 30) continue; // Skip 6:30 PM

                const hourFormatted = hour % 12 || 12;
                const ampm = hour < 12 ? 'AM' : 'PM';
                const minuteFormatted = minute === 0 ? '00' : minute;

                slots.push({
                    label: `${hourFormatted}:${minuteFormatted} ${ampm}`,
                    value: `${hour.toString().padStart(2, '0')}:${minuteFormatted}`
                });
            }
        }
        this.timeSlots = slots;
    }

    loadSpecialists(): void {
        this.loading = true;
        this.specialistService.getAllSpecialists().subscribe({
            next: (specialists) => {
                this.specialists = specialists;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading specialists:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translateService.instant('common.labels.error'),
                    detail: this.translateService.instant('pages.booking.loadSpecialistsError')
                });
                this.loading = false;
            }
        });
    }

    onDateSelect(): void {
        this.selectedTime = null;
        this.availableSpecialists = [];
    }

    onTimeSelect(): void {
        if (this.selectedDate && this.selectedTime) {
            this.checkAvailableSpecialists();
        }
    }

    checkAvailableSpecialists(): void {
        this.loading = true;
        this.availableSpecialists = [];

        // Create datetime from selected date and time
        const [hours, minutes] = this.selectedTime!.split(':').map(Number);
        const dateTime = new Date(this.selectedDate);
        dateTime.setHours(hours, minutes, 0, 0);

        this.specialistService.getAvailableSpecialists(dateTime).subscribe({
            next: (specialists) => {
                this.availableSpecialists = specialists;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error checking specialist availability:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translateService.instant('common.labels.error'),
                    detail: this.translateService.instant('pages.booking.checkAvailabilityError')
                });
                this.loading = false;
            }
        });
    }

    selectSpecialist(specialist: Specialist): void {
        this.selectedSpecialist = specialist;
        this.bookingConfirmDialog = true;
    }

    confirmBooking(): void {
        if (!this.selectedSpecialist || !this.selectedDate || !this.selectedTime) {
            return;
        }

        this.loading = true;

        // Create datetime from selected date and time
        const [hours, minutes] = this.selectedTime.split(':').map(Number);
        const startTime = new Date(this.selectedDate);
        startTime.setHours(hours, minutes, 0, 0);

        // End time is 30 minutes later
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        this.bookingService.bookSpecialist(this.selectedSpecialist.id, startTime, endTime, this.bookingNotes).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: this.translateService.instant('common.labels.success'),
                    detail: this.translateService.instant('pages.booking.bookingSuccess')
                });
                this.bookingConfirmDialog = false;
                this.loading = false;
                this.reset();
            },
            error: (error) => {
                console.error('Error booking specialist:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: this.translateService.instant('common.labels.error'),
                    detail: this.translateService.instant('pages.booking.bookingError')
                });
                this.loading = false;
            }
        });
    }

    cancelBooking(): void {
        this.bookingConfirmDialog = false;
    }

    reset(): void {
        this.selectedTime = null;
        this.availableSpecialists = [];
        this.selectedSpecialist = null;
        this.bookingNotes = '';
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString();
    }

    getSpecialistAvatarUrl(specialist: Specialist): string {
        return specialist.photoURL || 'assets/images/default-avatar.png';
    }
}
