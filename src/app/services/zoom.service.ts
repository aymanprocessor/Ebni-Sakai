// src/app/services/zoom.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';
import { SweetalertService } from './sweetalert.service';
import { TokenStorageService } from './token-storage.service';
import { Booking } from '../models/booking.model';
import { AuthService } from './auth.service';
import { ZoomMtg } from '@zoom/meetingsdk';
import { environment } from '../../environments/env.dev';
interface MeetingConfig {
    topic: string;
    startTime: string;
    duration: number;
}

@Injectable({
    providedIn: 'root'
})
export class ZoomService {
    private readonly API_ENDPOINT = 'https://petal-tidal-kicker.glitch.me/zoom/createMeeting';

    constructor(
        private http: HttpClient,
        private sweetalertService: SweetalertService,
        private envService: EnvironmentService,
        private authService: AuthService,
        private tokenStorage: TokenStorageService
    ) {}

    /**
     * Helper method to load a script and wait for it to load
     */
    private loadScript(src: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
        });
    }

    /**
     * Generate a signature for joining a Zoom meeting
     * @param meetingNumber The meeting number
     * @param role The role (0 for attendee, 1 for host)
     * @returns Observable with signature
     */
    generateSignature(meetingNumber: string, role: number): Observable<string> {
        const url = this.envService.getZoomProxyUrl() + '/generate-signature';

        return this.http
            .get<{ signature: string }>(url, {
                params: { meetingNumber, role: role.toString() }
            })
            .pipe(
                map((response) => response.signature),
                catchError((error) => {
                    this.envService.logError('Error generating signature:', error);
                    this.sweetalertService.showError('Failed to generate meeting signature', 'Zoom Error');
                    return throwError(() => error);
                })
            );
    }

    /**
     * Create a new Zoom meeting using server-to-server auth
     * @param topic Meeting topic
     * @param startTime Start time (ISO format)
     * @param duration Duration in minutes
     * @returns Observable with meeting details
     */
    createMeeting(topic: string, startTime: string, duration: number): Observable<any> {
        const meetingConfig = {
            topic,
            type: 2, // Scheduled meeting
            start_time: startTime,
            duration,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                auto_recording: 'none',
                approval_type: 1
            }
        };

        return this.http.post(this.API_ENDPOINT, meetingConfig).pipe(
            catchError((error) => {
                this.envService.logError('Error creating Zoom meeting:', error);
                this.sweetalertService.showError('Failed to create Zoom meeting', 'Zoom Error');
                return throwError(() => error);
            })
        );
    }

    /**
     * Create multiple Zoom meetings at once
     * @param meetings Array of meeting configs
     */
    createMultipleMeetings(meetings: MeetingConfig[]): Observable<any[]> {
        const meetingCreations = meetings.map((meeting) => this.createMeeting(meeting.topic, meeting.startTime, meeting.duration));
        return from(Promise.all(meetingCreations));
    }

    /**
     * Create a Zoom meeting for a specific booking
     * @param booking The booking to create a meeting for
     */
    createMeetingForBooking(booking: Booking): Observable<any> {
        if (!booking.timeSlot) {
            return throwError(() => new Error('Booking has no time slot'));
        }

        const startTime = booking.timeSlot.startTime.toISOString();
        const endTime = booking.timeSlot.endTime;
        const duration = Math.round((endTime.getTime() - booking.timeSlot.startTime.getTime()) / (60 * 1000));
        const topic = `Session with ${booking.userName}`;

        return this.createMeeting(topic, startTime, duration);
    }

    /**
     * Join a Zoom meeting
     * @param meetingNumber Meeting number/ID
     * @param meetingPassword Meeting password
     * @param displayName User's display name
     */
    async joinMeeting(meetingNumber: string, meetingPassword: string, displayName: string): Promise<void> {
        debugger;
        try {
            ZoomMtg.init({
                leaveUrl: window.location.origin + '/app/session',
                disableCORP: true,
                disablePreview: false,
                success: async () => {
                    try {
                        // Generate signature for the meeting
                        const signature = await this.generateSignature(meetingNumber, 0).toPromise();

                        // Join the meeting
                        ZoomMtg.join({
                            meetingNumber: meetingNumber,
                            signature: signature!,
                            userName: displayName,
                            sdkKey: environment.zoom.sdkKey,
                            passWord: meetingPassword,
                            success: () => {
                                console.log('Joined Zoom meeting successfully');
                            },
                            error: (error: any) => {
                                console.error('Failed to join Zoom meeting:', error);
                                this.sweetalertService.showError('Failed to join Zoom meeting', 'Zoom Error');
                            }
                        });
                    } catch (error) {
                        console.error('Error generating signature:', error);
                        this.sweetalertService.showError('Failed to generate meeting signature', 'Zoom Error');
                    }
                },
                error: (error: any) => {
                    console.error('Failed to initialize Zoom meeting:', error);
                    this.sweetalertService.showError('Failed to initialize Zoom meeting', 'Zoom Error');
                }
            });
        } catch (error) {
            console.error('Error joining Zoom meeting:', error);
            this.sweetalertService.showError('Error joining Zoom meeting', 'Zoom Error');
        }
    }

    /**
     * Check if user is the host of a booking
     */
    isCurrentUserHost(booking: Booking): boolean {
        const currentUser = this.authService.getCurrentUser();
        return booking.assignedSpecialistId === currentUser?.uid;
    }
}
