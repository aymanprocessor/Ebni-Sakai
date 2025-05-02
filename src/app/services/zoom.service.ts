// src/app/services/zoom.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { environment } from '../../app/env/env';
import { catchError, map } from 'rxjs/operators';
import { SweetalertService } from './sweetalert.service';

@Injectable({
    providedIn: 'root'
})
export class ZoomService {
    private readonly API_URL = 'https://api.zoom.us/v2';
    private token: string = '';

    constructor(
        private http: HttpClient,
        private sweetalertService: SweetalertService
    ) {
        // Initialize the Zoom SDK
        this.initializeZoomSDK();
    }

    /**
     * Initialize the Zoom Meeting SDK
     */
    private async initializeZoomSDK(): Promise<void> {
        try {
            // Load the Zoom Meeting SDK script dynamically
            const script = document.createElement('script');
            script.src = 'https://source.zoom.us/2.18.0/lib/vendor/react.min.js';
            document.head.appendChild(script);

            const script2 = document.createElement('script');
            script2.src = 'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js';
            document.head.appendChild(script2);

            const script3 = document.createElement('script');
            script3.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js';
            document.head.appendChild(script3);

            const script4 = document.createElement('script');
            script4.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js';
            document.head.appendChild(script4);

            const script5 = document.createElement('script');
            script5.src = 'https://source.zoom.us/zoom-meeting-2.18.0.min.js';
            document.head.appendChild(script5);

            // Wait for the script to load
            await new Promise<void>((resolve) => {
                script5.onload = () => resolve();
            });

            console.log('Zoom Meeting SDK loaded successfully');
        } catch (error) {
            console.error('Failed to initialize Zoom Meeting SDK:', error);
            this.sweetalertService.showError('Failed to initialize Zoom Meeting SDK', 'Zoom Error');
        }
    }

    /**
     * Generate a signature for joining a Zoom meeting
     * @param meetingNumber The meeting number
     * @param role The role (0 for attendee, 1 for host)
     * @returns Signature string
     */
    private generateSignature(meetingNumber: string, role: number): Observable<{ signature: string }> {
        return this.http.get<{ signature: string }>(`https://generatezoomsignature-bxkjtqi7iq-uc.a.run.app`, {
            params: { meetingNumber, role: role.toString() }
        });
    }
    /**
     * Create a new Zoom meeting
     * @param topic Meeting topic
     * @param startTime Start time (ISO format)
     * @param duration Duration in minutes
     * @returns Observable with meeting details
     */
    createMeeting(topic: string, startTime: string, duration: number): Observable<any> {
        const url = `https://petal-tidal-kicker.glitch.me/zoom/meetings`;

        const meetingConfig = {
            topic: topic,
            type: 2, // Scheduled meeting
            start_time: startTime,
            duration: duration,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                auto_recording: 'none'
            }
        };

        // In a real application, you'd use your backend to create meetings
        // This is just a placeholder for the API call structure
        const headers = new HttpHeaders({
            Authorization:
                'Bearer eyJzdiI6IjAwMDAwMiIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6IjM3Nzg4NzdmLTljNGEtNDM0Yi1iYjUwLWMyNDZkNTg5ZDRhNCJ9.eyJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiJEbG91SS1zU1NGcUtJMWV2d0NZT3h3IiwidmVyIjoxMCwiYXVpZCI6Ijg4YmMxM2I1YTc1ZWM1MWRmYzIzZmE5MTNhYjA0NDVlNGI2M2FjZTk0Mzk0Y2RlZTRhYjJkNWNiMGJjYjhjM2UiLCJuYmYiOjE3NDYxNDU4MTEsImNvZGUiOiJYOWVaRGI1YTRWRzJsclhCRnZVVEo2bHUzMEhmX3NMdXciLCJpc3MiOiJ6bTpjaWQ6QThMUHZybDhSdWlhY1Y0Q2hYbWFBIiwiZ25vIjowLCJleHAiOjE3NDYxNDk0MTEsInR5cGUiOjAsImlhdCI6MTc0NjE0NTgxMSwiYWlkIjoibGhSZUZnRnhURGlVTENwNzg3OG9BdyJ9.F0g9U-PR3doj6u8PSXQLoTIIcBTKo7xBjOUldTzxe0s6c6DvzvJvGuHcfNjyqea1KvEg4ozW1PQ_s-XjNd0nvg',
            'Content-Type': 'application/json'
        });

        return this.http.post(url, meetingConfig, { headers }).pipe(
            catchError((error) => {
                console.error('Error creating Zoom meeting:', error);
                this.sweetalertService.showError('Failed to create Zoom meeting', 'Zoom Error');
                return throwError(() => error);
            })
        );

        // return this.getAuthToken().pipe(
        //     map((token) => {
        //         console.log('Zoom token:', token);
        //         const headers = new HttpHeaders({
        //             Authorization: `Bearer eyJzdiI6IjAwMDAwMiIsImFsZyI6IkhTNTEyIiwidiI6IjIuMCIsImtpZCI6IjM3Nzg4NzdmLTljNGEtNDM0Yi1iYjUwLWMyNDZkNTg5ZDRhNCJ9.eyJhdWQiOiJodHRwczovL29hdXRoLnpvb20udXMiLCJ1aWQiOiJEbG91SS1zU1NGcUtJMWV2d0NZT3h3IiwidmVyIjoxMCwiYXVpZCI6Ijg4YmMxM2I1YTc1ZWM1MWRmYzIzZmE5MTNhYjA0NDVlNGI2M2FjZTk0Mzk0Y2RlZTRhYjJkNWNiMGJjYjhjM2UiLCJuYmYiOjE3NDYxNDU4MTEsImNvZGUiOiJYOWVaRGI1YTRWRzJsclhCRnZVVEo2bHUzMEhmX3NMdXciLCJpc3MiOiJ6bTpjaWQ6QThMUHZybDhSdWlhY1Y0Q2hYbWFBIiwiZ25vIjowLCJleHAiOjE3NDYxNDk0MTEsInR5cGUiOjAsImlhdCI6MTc0NjE0NTgxMSwiYWlkIjoibGhSZUZnRnhURGlVTENwNzg3OG9BdyJ9.F0g9U-PR3doj6u8PSXQLoTIIcBTKo7xBjOUldTzxe0s6c6DvzvJvGuHcfNjyqea1KvEg4ozW1PQ_s-XjNd0nvg`,
        //             'Content-Type': 'application/json'
        //         });

        //         return this.http.post(url, meetingConfig, { headers }).pipe(
        //             catchError((error) => {
        //                 console.error('Error creating Zoom meeting:', error);
        //                 this.sweetalertService.showError('Failed to create Zoom meeting', 'Zoom Error');
        //                 return throwError(() => error);
        //             })
        //         );
        //     })
        // );
    }

    /**
     * Create multiple Zoom meetings at once
     * @param meetings Array of meeting configs
     */
    createMultipleMeetings(meetings: Array<{ topic: string; startTime: string; duration: number }>): Observable<any[]> {
        // Create an array of observables for each meeting creation
        const meetingCreations = meetings.map((meeting) => this.createMeeting(meeting.topic, meeting.startTime, meeting.duration));

        // Convert array of observables to a single observable
        return from(Promise.all(meetingCreations));
    }

    /**
     * Join a Zoom meeting
     * @param meetingNumber Meeting number/ID
     * @param meetingPassword Meeting password
     * @param displayName User's display name
     * @param elementId DOM element ID where to render the meeting
     */
    joinMeeting(meetingNumber: string, meetingPassword: string, displayName: string, elementId: string): void {
        try {
            // Ensure Zoom SDK is loaded
            if (!(window as any).ZoomMtg) {
                this.sweetalertService.showError('Zoom SDK not loaded', 'Error');
                return;
            }

            const ZoomMtg = (window as any).ZoomMtg;

            // Initialize the Zoom Meeting
            ZoomMtg.init({
                leaveUrl: window.location.origin + '/app/session',
                success: () => {
                    // Generate signature
                    const signature = this.generateSignature(meetingNumber, 0);

                    // Join the meeting
                    ZoomMtg.join({
                        meetingNumber: meetingNumber,
                        userName: displayName,
                        signature: signature,
                        apiKey: environment.zoom.apiKey,
                        userEmail: '',
                        passWord: meetingPassword,
                        success: () => {
                            console.log('Joined Zoom meeting successfully');
                        },
                        error: (error: any) => {
                            console.error('Failed to join Zoom meeting:', error);
                            this.sweetalertService.showError('Failed to join Zoom meeting', 'Zoom Error');
                        }
                    });
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
     * Get authentication token for Zoom API
     * In production, this should be handled by your backend
     */
    private getAuthToken(): Observable<string> {
        const url = 'https://getzoomaccesstoken-bxkjtqi7iq-uc.a.run.app'; // Your deployed function URL

        const body = {
            // Replace with actual values expected by your backend
            code: 'X9eZDb5a4VG2lrXBFvUTJ6lu30Hf_sLuw'
        };

        return this.http.post<{ access_token: string }>(url, body).pipe(
            map((response) => {
                this.token = response.access_token;
                return this.token;
            })
        );
    }
    /**
     * End a Zoom meeting
     * @param meetingId The meeting ID to end
     */
    endMeeting(meetingId: string): Observable<any> {
        const url = `${this.API_URL}/meetings/${meetingId}/status`;

        return this.getAuthToken().pipe(
            map((token) => {
                const headers = new HttpHeaders({
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                });

                return this.http.put(url, { action: 'end' }, { headers }).pipe(
                    catchError((error) => {
                        console.error('Error ending Zoom meeting:', error);
                        this.sweetalertService.showError('Failed to end Zoom meeting', 'Zoom Error');
                        return throwError(() => error);
                    })
                );
            })
        );
    }
}
