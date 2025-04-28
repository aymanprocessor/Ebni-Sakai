// src/app/services/specialist.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, getDoc, query, where, documentId, getDocs, orderBy, Timestamp, addDoc, limit, updateDoc } from '@angular/fire/firestore';
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { Specialist } from '../models/specialist.model';
import { BookingService } from './booking.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SpecialistService {
    private readonly SPECIALISTS_COLLECTION = 'specialists';

    constructor(
        private firestore: Firestore,
        private bookingService: BookingService,
        private authService: AuthService
    ) {}

    /**
     * Get all specialists
     */
    getAllSpecialists(): Observable<Specialist[]> {
        const specialistsRef = collection(this.firestore, this.SPECIALISTS_COLLECTION);
        const q = query(specialistsRef, orderBy('lastName'));

        return collectionData(q, { idField: 'id' }) as Observable<Specialist[]>;
    }

    /**
     * Get specialist by ID
     */
    getSpecialistById(id: string): Observable<Specialist | null> {
        const specialistRef = doc(this.firestore, `${this.SPECIALISTS_COLLECTION}/${id}`);

        return from(getDoc(specialistRef)).pipe(map((doc) => (doc.exists() ? ({ ...doc.data(), id: doc.id } as Specialist) : null)));
    }

    /**
     * Get specialist by user ID
     */
    getSpecialistByUserId(uid: string): Observable<Specialist | null> {
        const specialistsRef = collection(this.firestore, this.SPECIALISTS_COLLECTION);
        const q = query(specialistsRef, where('uid', '==', uid), limit(1));

        return from(getDocs(q)).pipe(
            map((snapshot) => {
                if (snapshot.empty) return null;
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() } as Specialist;
            })
        );
    }

    /**
     * Get specialists by array of IDs
     */
    getSpecialistsByIds(ids: string[]): Observable<Specialist[]> {
        if (!ids.length) return of([]);

        // Process in batches of 10 (Firestore limitation for 'in' queries)
        const batches = [];
        for (let i = 0; i < ids.length; i += 10) {
            const batch = ids.slice(i, i + 10);
            const specialistsRef = collection(this.firestore, this.SPECIALISTS_COLLECTION);
            const q = query(specialistsRef, where(documentId(), 'in', batch));

            batches.push(collectionData(q, { idField: 'id' }) as Observable<Specialist[]>);
        }

        return forkJoin(batches).pipe(map((results) => results.flat()));
    }

    /**
     * Get specialists available at a specific date and time
     */
    getAvailableSpecialists(date: Date, time?: string): Observable<Specialist[]> {
        // Create a time window (start of selected time to +30 minutes)
        const startTime = new Date(date);
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            startTime.setHours(hours, minutes, 0, 0);
        }
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        // First get all specialists
        return this.getAllSpecialists().pipe(
            switchMap((specialists) => {
                if (!specialists.length) return of([]);

                // For each specialist, check if they have any existing bookings that conflict
                return this.bookingService.getBookingsInTimeRange(startTime, endTime).pipe(
                    map((bookings) => {
                        // Filter out specialists who already have bookings in this time slot
                        const bookedSpecialistIds = bookings.map((booking) => booking.specialistId);

                        return specialists.filter((specialist) => !bookedSpecialistIds.includes(specialist.id) && specialist.isAvailable);
                    })
                );
            })
        );
    }

    /**
     * Book an appointment with a specialist
     */
    bookAppointment(bookingDetails: { specialistId: string; date: Date; time: string; notes?: string }): Observable<string> {
        // Combine date and time
        const startTime = this.combineDateAndTime(bookingDetails.date, bookingDetails.time);
        const endTime = this.calculateEndTime(bookingDetails.date, bookingDetails.time);

        // Use BookingService to book the specialist
        return this.bookingService.bookSpecialist(bookingDetails.specialistId, startTime, endTime, bookingDetails.notes);
    }

    /**
     * Update specialist availability
     */
    updateSpecialistAvailability(uid: string, isAvailable: boolean, availabilitySchedule: any): Observable<void> {
        return this.getSpecialistByUserId(uid).pipe(
            switchMap((specialist) => {
                if (!specialist) {
                    throw new Error('Specialist profile not found');
                }

                const specialistRef = doc(this.firestore, `${this.SPECIALISTS_COLLECTION}/${specialist.id}`);

                // Process the schedule data before storing
                const processedSchedule = this.processAvailabilitySchedule(availabilitySchedule);

                return from(
                    updateDoc(specialistRef, {
                        isAvailable: isAvailable,
                        availabilitySchedule: processedSchedule,
                        updatedAt: Timestamp.now()
                    })
                );
            })
        );
    }

    /**
     * Process availability schedule for storage
     * Converts Date objects to Firestore Timestamps
     */
    private processAvailabilitySchedule(schedule: any): any {
        if (!schedule || !schedule.days) return schedule;

        const processedDays = schedule.days.map((day: any) => {
            const processedTimeRanges = day.timeRanges.map((range: any) => ({
                start: Timestamp.fromDate(range.start),
                end: Timestamp.fromDate(range.end)
            }));

            return {
                ...day,
                timeRanges: processedTimeRanges
            };
        });

        return {
            ...schedule,
            days: processedDays
        };
    }

    /**
     * Combine date and time into a single Date object
     */
    private combineDateAndTime(date: Date, time: string): Date {
        const [hours, minutes] = time.split(':').map(Number);
        const combinedDateTime = new Date(date);
        combinedDateTime.setHours(hours, minutes, 0, 0);
        return combinedDateTime;
    }

    /**
     * Calculate end time (30 minutes after start time)
     */
    private calculateEndTime(date: Date, time: string): Date {
        const startTime = this.combineDateAndTime(date, time);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);
        return endTime;
    }
}
