import { TimeSlot } from './time-slot.model';

export interface Session {
    id?: string;
    timeSlotId: string;
    userId: string;
    userName: string;
    userEmail: string;
    bookingDate: Date;
    notes: string;
    status: 'confirmed' | 'cancelled';
    timeSlot?: TimeSlot;
}
