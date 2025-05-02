import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc, query, where, getDoc, onSnapshot, DocumentReference, Timestamp, runTransaction, writeBatch, getDocs, documentId, docData } from '@angular/fire/firestore';
import { Observable, from, map, switchMap, of, BehaviorSubject, combineLatest, take, shareReplay, tap, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { Booking } from '../models/booking.model';
import { TimeSlot } from '../models/time-slot.model';
import { UserProfile } from '../models/user.model';
import { ZoomMeeting } from '../models/zoom-meeting.model';
import { SweetalertService } from './sweetalert.service';
import { ZoomService } from './zoom.service';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    private timeSlotsSubject = new BehaviorSubject<TimeSlot[]>([]);
    timeSlots$ = this.timeSlotsSubject.asObservable().pipe(shareReplay(1));

    private readonly TIME_SLOTS_COLLECTION = 'timeSlots';
    private readonly BOOKINGS_COLLECTION = 'bookings';
    private readonly USERS_COLLECTION = 'users';
    private timeSlotsCache = new Map<string, TimeSlot>();

    constructor(
        private firestore: Firestore,
        private authService: AuthService,
        private sweetalertService: SweetalertService,
        private zoomService: ZoomService
    ) {
        this.initTimeSlotListener();
    }

    private initTimeSlotListener(): void {
        const timeSlotsRef = collection(this.firestore, this.TIME_SLOTS_COLLECTION);

        const currentTime = new Date();
        currentTime.setHours(0, 0, 0, 0);

        onSnapshot(
            query(timeSlotsRef, where('startTime', '>=', Timestamp.fromDate(currentTime))),
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const doc = change.doc;
                    const data = doc.data();
                    const timeSlot = {
                        id: doc.id,
                        startTime: data['startTime']?.toDate(),
                        endTime: data['endTime']?.toDate(),
                        isBooked: data['isBooked'] || false,
                        createdBy: data['createdBy'],
                        updatedAt: data['updatedAt']?.toDate()
                    } as TimeSlot;

                    if (change.type === 'removed') {
                        this.timeSlotsCache.delete(doc.id);
                    } else {
                        this.timeSlotsCache.set(doc.id, timeSlot);
                    }
                });

                const timeSlots = Array.from(this.timeSlotsCache.values());
                this.timeSlotsSubject.next(timeSlots);
            },
            (error) => {
                console.error('Error fetching time slots:', error);
            }
        );
    }

    private async getTimeSlotsBatch(timeSlotIds: string[]): Promise<Map<string, TimeSlot>> {
        const timeSlotMap = new Map<string, TimeSlot>();

        const uncachedIds = timeSlotIds.filter((id) => {
            const cached = this.timeSlotsCache.get(id);
            if (cached) {
                timeSlotMap.set(id, cached);
                return false;
            }
            return true;
        });

        if (uncachedIds.length === 0) {
            return timeSlotMap;
        }

        const chunks = [];
        for (let i = 0; i < uncachedIds.length; i += 10) {
            chunks.push(uncachedIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(collection(this.firestore, this.TIME_SLOTS_COLLECTION), where(documentId(), 'in', chunk));

            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
                const data = doc.data();
                const timeSlot = {
                    id: doc.id,
                    startTime: data['startTime']?.toDate(),
                    endTime: data['endTime']?.toDate(),
                    isBooked: data['isBooked'] || false,
                    createdBy: data['createdBy'],
                    updatedAt: data['updatedAt']?.toDate()
                } as TimeSlot;

                timeSlotMap.set(doc.id, timeSlot);
                this.timeSlotsCache.set(doc.id, timeSlot);
            });
        }

        return timeSlotMap;
    }

    getBookingById(bookingId: string): Observable<Booking | null> {
        const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);

        return docData(bookingRef, { idField: 'id' }).pipe(
            switchMap(async (booking: any) => {
                if (!booking) return null;

                // Get time slot data
                if (booking.timeSlotId) {
                    const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${booking.timeSlotId}`);
                    const timeSlotDoc = await getDoc(timeSlotRef);

                    if (timeSlotDoc.exists()) {
                        const timeSlotData = timeSlotDoc.data();
                        booking.timeSlot = {
                            id: timeSlotDoc.id,
                            startTime: timeSlotData['startTime']?.toDate(),
                            endTime: timeSlotData['endTime']?.toDate(),
                            isBooked: timeSlotData['isBooked'] || false
                        };
                    }
                }

                // Convert timestamps to dates
                if (booking.bookingDate) {
                    booking.bookingDate = booking.bookingDate.toDate();
                }

                if (booking.zoomMeeting && booking.zoomMeeting.startTime) {
                    booking.zoomMeeting.startTime = booking.zoomMeeting.startTime.toDate();
                }

                return booking as Booking;
            }),
            catchError((error) => {
                console.error('Error fetching booking:', error);
                return of(null);
            })
        );
    }

    getUserBookings(): Observable<Booking[]> {
        return this.authService.currentUser$.pipe(
            switchMap((user) => {
                console.log('getUserBookings - Current user:', user);
                if (!user) {
                    console.log('No user found, returning empty array');
                    return of([]);
                }

                return new Observable<Booking[]>((subscriber) => {
                    const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
                    // Temporarily remove the status filter to avoid index requirement
                    const q = query(bookingsRef, where('userId', '==', user.uid));

                    console.log('Setting up onSnapshot listener');

                    const unsubscribe = onSnapshot(
                        q,
                        async (snapshot) => {
                            console.log('onSnapshot triggered, documents:', snapshot.size);

                            // Filter out cancelled bookings in memory
                            const bookingsData = snapshot.docs
                                .map((doc) => {
                                    const data = doc.data();
                                    return {
                                        id: doc.id,
                                        timeSlotId: data['timeSlotId'],
                                        userId: data['userId'],
                                        userName: data['userName'],
                                        userEmail: data['userEmail'],
                                        bookingDate: data['bookingDate']?.toDate(),
                                        notes: data['notes'] || '',
                                        status: data['status'],
                                        zoomMeeting: data['zoomMeeting'] || undefined
                                    };
                                })
                                .filter((booking) => booking.status !== 'cancelled');

                            if (bookingsData.length === 0) {
                                subscriber.next([]);
                                return;
                            }

                            // Get all unique timeSlotIds
                            const timeSlotIds = [...new Set(bookingsData.map((booking) => booking.timeSlotId))];

                            try {
                                // Fetch time slots for all bookings
                                const timeSlotMap = await this.getTimeSlotsBatch(timeSlotIds);

                                // Combine bookings with their timeSlots
                                const bookingsWithTimeSlots = bookingsData.map(
                                    (booking) =>
                                        ({
                                            ...booking,
                                            timeSlot: timeSlotMap.get(booking.timeSlotId)
                                        }) as Booking
                                );

                                subscriber.next(bookingsWithTimeSlots);
                            } catch (error) {
                                console.error('Error fetching time slots:', error);
                                // Return bookings without timeSlots if there's an error
                                subscriber.next(bookingsData as Booking[]);
                            }
                        },
                        (error) => {
                            console.error('onSnapshot error:', error);
                            subscriber.error(error);
                        }
                    );

                    // Cleanup function
                    return () => {
                        console.log('Unsubscribing from onSnapshot');
                        unsubscribe();
                    };
                });
            }),
            shareReplay(1)
        );
    }

    // Add this method to your existing BookingService

    getSpecialistBookings(): Observable<Booking[]> {
        return this.authService.currentUser$.pipe(
            switchMap((user) => {
                if (!user || user.role !== 'specialist') {
                    return of([]);
                }

                // Query bookings assigned to this specialist
                const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
                const q = query(bookingsRef, where('assignedSpecialistId', '==', user.uid));

                return collectionData(q, { idField: 'id' }).pipe(
                    switchMap(async (bookings) => {
                        // Get all unique timeSlotIds
                        const timeSlotIds = [...new Set(bookings.map((booking) => booking['timeSlotId']))];

                        if (timeSlotIds.length === 0) {
                            return [];
                        }

                        // Fetch time slots for all bookings
                        const timeSlotMap = await this.getTimeSlotsBatch(timeSlotIds);

                        // Combine bookings with their timeSlots
                        return bookings.map(
                            (booking) =>
                                ({
                                    ...booking,
                                    timeSlot: timeSlotMap.get(booking['timeSlotId'])
                                }) as Booking
                        );
                    })
                );
            }),
            shareReplay(1)
        );
    }
    /**
     * Book a time slot with Zoom meeting
     * @param timeSlotId The time slot ID to book
     * @param notes Optional booking notes
     * @returns Promise with the booking ID
     */
    async bookTimeSlotWithZoom(timeSlotId: string, notes: string = ''): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to book a time slot');
        }

        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('Time slot not found');
            }

            const timeSlotData = timeSlotDoc.data();
            if (timeSlotData['isBooked']) {
                throw new Error('Time slot is already booked');
            }

            // Get specialists for this time slot
            const specialists = await this.getAvailableSpecialistsForTimeSlot(timeSlotData['startTime'].toDate(), timeSlotData['endTime'].toDate());

            if (specialists.length === 0) {
                throw new Error('No specialists available for this time slot');
            }

            // Find the least busy specialist
            const leastBusySpecialist = await this.findLeastBusySpecialist(specialists);

            // Create a Zoom meeting for this booking
            const startTime = timeSlotData['startTime'].toDate();
            const endTime = timeSlotData['endTime'].toDate();
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000)); // in minutes

            // Format the date for Zoom API (ISO format)
            const zoomStartTime = startTime.toISOString();

            // Create meeting topic
            const meetingTopic = `Session with ${leastBusySpecialist.firstName} ${leastBusySpecialist.lastName}`;

            try {
                // Create Zoom meeting using our server-to-server API
                const zoomMeetingResult = await this.zoomService.createMeeting(meetingTopic, zoomStartTime, duration).toPromise();
                const zoomMeeting = this.transformZoomApiResponseToModel(zoomMeetingResult);

                // Create booking with Zoom meeting details
                const bookingRef = doc(collection(this.firestore, this.BOOKINGS_COLLECTION));
                const bookingData = {
                    timeSlotId: timeSlotId,
                    userId: currentUser.uid,
                    userName: currentUser.displayName || '',
                    userEmail: currentUser.email || '',
                    assignedSpecialistId: leastBusySpecialist.uid,
                    assignedSpecialistName: `${leastBusySpecialist.firstName} ${leastBusySpecialist.lastName}`,
                    bookingDate: Timestamp.now(),
                    notes: notes,
                    status: 'pending',
                    zoomMeeting: {
                        id: zoomMeeting.id,
                        meetingNumber: zoomMeeting.meetingNumber,
                        password: zoomMeeting.password,
                        joinUrl: zoomMeeting.joinUrl,
                        hostUrl: zoomMeeting.hostUrl || zoomMeeting.joinUrl,
                        topic: zoomMeeting.topic,
                        startTime: Timestamp.fromDate(zoomMeeting.startTime),
                        duration: zoomMeeting.duration
                    }
                };

                transaction.set(bookingRef, bookingData);

                // Update time slot
                transaction.update(timeSlotRef, {
                    isBooked: true,
                    bookedBy: currentUser.uid,
                    assignedSpecialistId: leastBusySpecialist.uid,
                    updatedAt: Timestamp.now()
                });

                return bookingRef.id;
            } catch (error) {
                console.error('Error creating Zoom meeting:', error);
                throw new Error('Failed to create Zoom meeting for booking');
            }
        });
    }

    /**
     * Book a time slot with auto-assignment of specialist and Zoom meeting
     * @param timeSlotId The time slot ID to book
     * @param notes Optional booking notes
     */
    async bookTimeSlotWithAutoAssignAndZoom(timeSlotId: string, notes: string = ''): Promise<string> {
        try {
            return await this.bookTimeSlotWithZoom(timeSlotId, notes);
        } catch (error) {
            this.sweetalertService.showError('Failed to book time slot', 'Error');
            throw error;
        }
    }

    /**
     * Cancel a booking and its associated Zoom meeting
     * @param bookingId The booking ID to cancel
     * @param timeSlotId The associated time slot ID
     */
    async cancelBookingWithZoom(bookingId: string, timeSlotId: string): Promise<void> {
        await runTransaction(this.firestore, async (transaction) => {
            const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);
            const bookingDoc = await transaction.get(bookingRef);

            if (!bookingDoc.exists()) {
                throw new Error('Booking not found');
            }

            const bookingData = bookingDoc.data();

            // Update booking status
            transaction.update(bookingRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            });

            // Reset time slot availability
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            transaction.update(timeSlotRef, {
                isBooked: false,
                bookedBy: null,
                assignedSpecialistId: null,
                updatedAt: Timestamp.now()
            });
        });
    }
    /**
     * Confirm a booking by a specialist
     * @param bookingId The booking ID to confirm
     */
    async confirmBooking(bookingId: string): Promise<void> {
        const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);

        await updateDoc(bookingRef, {
            status: 'confirmed',
            updatedAt: Timestamp.now()
        });
    }

    /**
     * Complete a booking
     * @param bookingId The booking ID to mark as completed
     */
    async completeBooking(bookingId: string): Promise<void> {
        const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);

        await updateDoc(bookingRef, {
            status: 'completed',
            updatedAt: Timestamp.now()
        });
    }

    /**
     * Transform Zoom API response to our ZoomMeeting model
     * @param apiResponse The response from Zoom API
     */
    private transformZoomApiResponseToModel(apiResponse: any): ZoomMeeting {
        return {
            id: apiResponse.id,
            meetingNumber: apiResponse.id,
            password: apiResponse.password,
            joinUrl: apiResponse.join_url,
            hostUrl: apiResponse.start_url,
            topic: apiResponse.topic,
            startTime: new Date(apiResponse.start_time),
            duration: apiResponse.duration
        };
    }

    /**
     * Get bookings by status
     * @param status The booking status to filter by
     */
    getBookingsByStatus(status: 'confirmed' | 'cancelled' | 'completed' | 'pending'): Observable<Booking[]> {
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
        const statusQuery = query(bookingsRef, where('status', '==', status));

        return collectionData(statusQuery, { idField: 'id' }).pipe(
            map((bookings) => bookings as Booking[]),
            switchMap(async (bookings) => {
                // Get all unique timeSlotIds
                const timeSlotIds = [...new Set(bookings.map((booking) => booking.timeSlotId))];
                if (timeSlotIds.length === 0) return [];

                // Fetch time slots for all bookings
                const timeSlotMap = await this.getTimeSlotsBatch(timeSlotIds);

                // Combine bookings with their timeSlots
                return bookings.map((booking) => ({
                    ...booking,
                    timeSlot: timeSlotMap.get(booking.timeSlotId),
                    // Convert Firestore timestamp to Date for Zoom meeting
                    zoomMeeting: booking.zoomMeeting
                        ? {
                              ...booking.zoomMeeting,
                              startTime: booking.zoomMeeting.startTime instanceof Date ? booking.zoomMeeting.startTime : (booking.zoomMeeting.startTime as any)?.toDate() || new Date()
                          }
                        : undefined
                }));
            })
        );
    }
    // Create single time slot
    async createTimeSlot(timeSlot: Omit<TimeSlot, 'id'>): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to create time slots');
        }

        const newTimeSlotRef = doc(collection(this.firestore, this.TIME_SLOTS_COLLECTION));
        const timeSlotData = {
            startTime: Timestamp.fromDate(timeSlot.startTime),
            endTime: Timestamp.fromDate(timeSlot.endTime),
            isBooked: false,
            createdBy: currentUser.uid,
            updatedAt: Timestamp.now()
        };

        await setDoc(newTimeSlotRef, timeSlotData);
        return newTimeSlotRef.id;
    }

    // Create multiple time slots using batch
    async createMultipleTimeSlots(timeSlots: Omit<TimeSlot, 'id'>[]): Promise<string[]> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to create time slots');
        }

        const batch = writeBatch(this.firestore);
        const timeSlotIds: string[] = [];

        for (const timeSlot of timeSlots) {
            const newTimeSlotRef = doc(collection(this.firestore, this.TIME_SLOTS_COLLECTION));
            const timeSlotData = {
                startTime: Timestamp.fromDate(timeSlot.startTime),
                endTime: Timestamp.fromDate(timeSlot.endTime),
                isBooked: false,
                createdBy: currentUser.uid,
                updatedAt: Timestamp.now()
            };

            batch.set(newTimeSlotRef, timeSlotData);
            timeSlotIds.push(newTimeSlotRef.id);
        }

        await batch.commit();
        return timeSlotIds;
    }

    // Update time slot
    async updateTimeSlot(timeSlotId: string, timeSlotData: Partial<TimeSlot>): Promise<void> {
        const updateData: any = {
            updatedAt: Timestamp.now()
        };

        if (timeSlotData.startTime) {
            updateData.startTime = Timestamp.fromDate(timeSlotData.startTime);
        }

        if (timeSlotData.endTime) {
            updateData.endTime = Timestamp.fromDate(timeSlotData.endTime);
        }

        if (timeSlotData.isBooked !== undefined) {
            updateData.isBooked = timeSlotData.isBooked;
        }

        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
        await updateDoc(timeSlotRef, updateData);
    }

    // Delete time slot
    async deleteTimeSlot(timeSlotId: string): Promise<void> {
        const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
        await deleteDoc(timeSlotRef);
    }

    // Book a time slot
    async bookTimeSlot(timeSlotId: string, notes: string = ''): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to book a time slot');
        }

        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('Time slot not found');
            }

            const timeSlotData = timeSlotDoc.data();
            if (timeSlotData['isBooked']) {
                throw new Error('Time slot is already booked');
            }

            // Create booking
            const bookingRef = doc(collection(this.firestore, this.BOOKINGS_COLLECTION));
            const bookingData = {
                timeSlotId: timeSlotId,
                userId: currentUser.uid,
                userName: currentUser.displayName || '',
                userEmail: currentUser.email || '',
                bookingDate: Timestamp.now(),
                notes: notes,
                status: 'panding'
            };

            transaction.set(bookingRef, bookingData);

            // Update time slot
            transaction.update(timeSlotRef, {
                isBooked: true,
                bookedBy: currentUser.uid,
                updatedAt: Timestamp.now()
            });

            return bookingRef.id;
        });
    }

    // Cancel a booking
    async cancelBooking(bookingId: string, timeSlotId: string): Promise<void> {
        await runTransaction(this.firestore, async (transaction) => {
            const bookingRef = doc(this.firestore, `${this.BOOKINGS_COLLECTION}/${bookingId}`);
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);

            transaction.update(bookingRef, {
                status: 'cancelled',
                updatedAt: Timestamp.now()
            });

            transaction.update(timeSlotRef, {
                isBooked: false,
                bookedBy: null,
                updatedAt: Timestamp.now()
            });
        });
    }

    // Check for conflicts
    async checkForConflicts(startTime: Date, endTime: Date): Promise<boolean> {
        const existingSlots = this.timeSlotsSubject.getValue();

        return existingSlots.some((slot) => {
            return (startTime >= slot.startTime && startTime < slot.endTime) || (endTime > slot.startTime && endTime <= slot.endTime) || (startTime <= slot.startTime && endTime >= slot.endTime);
        });
    }

    // Get available time slots
    getAvailableTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$.pipe(map((slots) => slots.filter((slot) => !slot.isBooked)));
    }

    // Get all time slots
    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.timeSlots$;
    }

    // Get time slots in range
    getTimeSlotsInRange(startDate: Date, endDate: Date): Observable<TimeSlot[]> {
        return this.timeSlots$.pipe(map((slots) => slots.filter((slot) => slot.startTime >= startDate && slot.startTime <= endDate)));
    }

    // Get available slots grouped by date
    getAvailableSlotsGroupedByDate(): Observable<{ date: string; slots: TimeSlot[] }[]> {
        return this.timeSlots$.pipe(
            map((slots) => {
                const availableSlots = slots.filter((slot) => !slot.isBooked);

                const grouped = availableSlots.reduce(
                    (acc, slot) => {
                        const dateStr = slot.startTime.toDateString();
                        if (!acc[dateStr]) {
                            acc[dateStr] = [];
                        }
                        acc[dateStr].push(slot);
                        return acc;
                    },
                    {} as Record<string, TimeSlot[]>
                );

                return Object.entries(grouped).map(([date, slots]) => ({
                    date,
                    slots: slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                }));
            })
        );
    }
    /**
     * Get available dates where at least one specialist is available
     */
    getAvailableDates(startDate: Date, daysToFetch = 30): Observable<Date[]> {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + daysToFetch);

        return this.getAllSpecialists().pipe(
            switchMap((specialists) => {
                const specialistIds = specialists.map((s) => s.uid);

                if (specialistIds.length === 0) {
                    return of([]);
                }

                return this.getTimeSlotsInRange(startDate, endDate).pipe(
                    map((slots) => {
                        // Group time slots by date
                        const dateMap = new Map<string, Date>();

                        slots.forEach((slot) => {
                            if (!slot.isBooked) {
                                const dateKey = slot.startTime.toDateString();
                                dateMap.set(dateKey, new Date(slot.startTime));
                            }
                        });

                        // Convert map to array of dates
                        return Array.from(dateMap.values()).sort((a, b) => a.getTime() - b.getTime());
                    })
                );
            })
        );
    }

    /**
     * Get all specialists from the database
     */
    getAllSpecialists(): Observable<UserProfile[]> {
        const usersRef = collection(this.firestore, this.USERS_COLLECTION);
        const specialistsQuery = query(usersRef, where('role', '==', 'specialist'));

        return collectionData(specialistsQuery, { idField: 'uid' }) as Observable<UserProfile[]>;
    }

    /**
     * Book a time slot and assign to the least busy available specialist
     */
    async bookTimeSlotWithAutoAssign(timeSlotId: string, notes: string = ''): Promise<string> {
        const currentUser = await this.authService.getCurrentUser();

        if (!currentUser) {
            throw new Error('User must be authenticated to book a time slot');
        }

        return runTransaction(this.firestore, async (transaction) => {
            const timeSlotRef = doc(this.firestore, `${this.TIME_SLOTS_COLLECTION}/${timeSlotId}`);
            const timeSlotDoc = await transaction.get(timeSlotRef);

            if (!timeSlotDoc.exists()) {
                throw new Error('Time slot not found');
            }

            const timeSlotData = timeSlotDoc.data();
            if (timeSlotData['isBooked']) {
                throw new Error('Time slot is already booked');
            }

            // Get the time slot's start and end times
            const startTime = timeSlotData['startTime'].toDate();
            const endTime = timeSlotData['endTime'].toDate();

            // Find available specialists for this time slot
            const specialists = await this.getAvailableSpecialistsForTimeSlot(startTime, endTime);

            if (specialists.length === 0) {
                throw new Error('No specialists available for this time slot');
            }

            // Find the least busy specialist
            const leastBusySpecialist = await this.findLeastBusySpecialist(specialists);

            // Create booking
            const bookingRef = doc(collection(this.firestore, this.BOOKINGS_COLLECTION));
            const bookingData = {
                timeSlotId: timeSlotId,
                userId: currentUser.uid,
                userName: currentUser.displayName || '',
                userEmail: currentUser.email || '',
                assignedSpecialistId: leastBusySpecialist.uid,
                assignedSpecialistName: `${leastBusySpecialist.firstName} ${leastBusySpecialist.lastName}`,
                bookingDate: Timestamp.now(),
                notes: notes,
                status: 'panding'
            };

            transaction.set(bookingRef, bookingData);

            // Update time slot
            transaction.update(timeSlotRef, {
                isBooked: true,
                bookedBy: currentUser.uid,
                assignedSpecialistId: leastBusySpecialist.uid,
                updatedAt: Timestamp.now()
            });

            return bookingRef.id;
        });
    }

    /**
     * Get all specialists available for a specific time slot
     */
    private async getAvailableSpecialistsForTimeSlot(startTime: Date, endTime: Date): Promise<UserProfile[]> {
        // Get all specialists
        const usersRef = collection(this.firestore, this.USERS_COLLECTION);
        const specialistsQuery = query(usersRef, where('role', '==', 'specialist'));
        const specialistsSnapshot = await getDocs(specialistsQuery);

        const specialists: UserProfile[] = [];
        specialistsSnapshot.forEach((doc) => {
            specialists.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });

        // If no specialists, return empty array
        if (specialists.length === 0) {
            return [];
        }

        // Get all bookings for this time slot
        const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
        const bookingsQuery = query(bookingsRef, where('status', 'in', ['confirmed', 'panding']));

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const bookings: Booking[] = [];
        bookingsSnapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() } as Booking);
        });

        // Get all time slots for these bookings
        const timeSlotIds = bookings.map((booking) => booking.timeSlotId);
        const timeSlots = await this.getTimeSlotsBatchSync(timeSlotIds);

        // Find all specialists that have a booking during this time slot
        const busySpecialistIds = new Set<string>();

        bookings.forEach((booking) => {
            const timeSlot = timeSlots.get(booking.timeSlotId);
            if (timeSlot) {
                const bookingStartTime = timeSlot.startTime;
                const bookingEndTime = timeSlot.endTime;

                // Check if this booking overlaps with the requested time slot
                if ((startTime <= bookingStartTime && endTime > bookingStartTime) || (startTime >= bookingStartTime && startTime < bookingEndTime)) {
                    if (booking.assignedSpecialistId) {
                        busySpecialistIds.add(booking.assignedSpecialistId);
                    }
                }
            }
        });

        // Return all specialists that are not busy during this time slot
        return specialists.filter((specialist) => !busySpecialistIds.has(specialist.uid));
    }

    /**
     * Find the specialist with the fewest bookings
     */
    private async findLeastBusySpecialist(specialists: UserProfile[]): Promise<UserProfile> {
        if (specialists.length === 0) {
            throw new Error('No specialists available');
        }

        if (specialists.length === 1) {
            return specialists[0];
        }

        // Count bookings for each specialist
        const specialistBookingCounts = new Map<string, number>();

        for (const specialist of specialists) {
            const bookingsRef = collection(this.firestore, this.BOOKINGS_COLLECTION);
            const bookingsQuery = query(bookingsRef, where('assignedSpecialistId', '==', specialist.uid), where('status', 'in', ['confirmed', 'panding']));

            const bookingsSnapshot = await getDocs(bookingsQuery);
            specialistBookingCounts.set(specialist.uid, bookingsSnapshot.size);
        }

        // Find the specialist with the fewest bookings
        let leastBusySpecialist = specialists[0];
        let minBookings = specialistBookingCounts.get(leastBusySpecialist.uid) || 0;

        for (const specialist of specialists) {
            const bookingCount = specialistBookingCounts.get(specialist.uid) || 0;
            if (bookingCount < minBookings) {
                minBookings = bookingCount;
                leastBusySpecialist = specialist;
            }
        }

        return leastBusySpecialist;
    }

    /**
     * Synchronous version of getTimeSlotsBatch for use in transactions
     */
    private async getTimeSlotsBatchSync(timeSlotIds: string[]): Promise<Map<string, TimeSlot>> {
        const timeSlotMap = new Map<string, TimeSlot>();

        if (timeSlotIds.length === 0) {
            return timeSlotMap;
        }

        const chunks = [];
        for (let i = 0; i < timeSlotIds.length; i += 10) {
            chunks.push(timeSlotIds.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(collection(this.firestore, this.TIME_SLOTS_COLLECTION), where(documentId(), 'in', chunk));

            const snapshot = await getDocs(q);
            snapshot.forEach((doc) => {
                const data = doc.data();
                const timeSlot = {
                    id: doc.id,
                    startTime: data['startTime']?.toDate(),
                    endTime: data['endTime']?.toDate(),
                    isBooked: data['isBooked'] || false,
                    createdBy: data['createdBy'],
                    updatedAt: data['updatedAt']?.toDate()
                } as TimeSlot;

                timeSlotMap.set(doc.id, timeSlot);
            });
        }

        return timeSlotMap;
    }

    /**
     * Get dates in range that should be disabled (no available specialists)
     */
    getDisabledDates(startDate: Date, daysToFetch = 30): Observable<Date[]> {
        return this.getAvailableDates(startDate, daysToFetch).pipe(
            map((availableDates) => {
                const disabledDates: Date[] = [];
                const availableDateStrings = new Set(availableDates.map((date) => date.toDateString()));

                // Create array of all dates in range
                const currentDate = new Date(startDate);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + daysToFetch);

                // For each date in range, if not available, add to disabled
                while (currentDate <= endDate) {
                    if (!availableDateStrings.has(currentDate.toDateString())) {
                        disabledDates.push(new Date(currentDate));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                return disabledDates;
            })
        );
    }
    // Clear cache
    clearCache(): void {
        this.timeSlotsCache.clear();
        this.timeSlotsSubject.next([]);
    }
}
