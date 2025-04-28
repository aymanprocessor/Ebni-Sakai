// src/app/models/booking.model.ts
import { TimeSlot } from './time-slot.model';
import { Specialist } from './specialist.model';

export interface Booking {
    id?: string;
    userId: string;
    userName: string;
    userEmail: string;
    bookingDate: Date; // When the booking was made
    startTime: Date; // Start time of the appointment
    endTime: Date; // End time of the appointment
    notes: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'pending';

    // Specialist details
    specialistId: string; // ID of the specialist for this booking
    specialist?: Specialist; // Optional reference to specialist object

    // Legacy support for time slot based bookings
    timeSlotId?: string; // Now optional as we might use direct date/time
    timeSlot?: TimeSlot; // Optional reference to timeSlot if used
}
