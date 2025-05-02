import { TimeSlot } from './time-slot.model';
import { ZoomMeeting } from './zoom-meeting.model';
export interface Booking {
    id: string;
    timeSlotId: string;
    userId: string;
    userName: string;
    userEmail: string;
    assignedSpecialistId?: string;
    assignedSpecialistName?: string;
    bookingDate: Date;
    notes: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
    timeSlot?: TimeSlot;
    zoomMeeting?: ZoomMeeting;
}
