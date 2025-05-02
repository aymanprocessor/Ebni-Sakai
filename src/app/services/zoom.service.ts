// src/app/services/zoom.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';
import { SweetalertService } from './sweetalert.service';
import { TokenStorageService } from './token-storage.service';

interface MeetingConfig {
    topic: string;
    startTime: string;
    duration: number;
}

@Injectable({
    providedIn: 'root'
})
export class ZoomService {
    private readonly API_URL = 'https://api.zoom.us/v2';

    constructor(
        private http: HttpClient,
        private sweetalertService: SweetalertService,
        private envService: EnvironmentService,
        private tokenStorage: TokenStorageService
    ) {
        this.initializeZoomSDK();
    }

    /**
     * Initialize the Zoom Meeting SDK by loading required scripts
     */
    private async initializeZoomSDK(): Promise<void> {
        try {
            const scripts = [
                'https://source.zoom.us/2.18.0/lib/vendor/react.min.js',
                'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js',
                'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js',
                'https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js',
                'https://source.zoom.us/zoom-meeting-2.18.0.min.js'
            ];

            // Load scripts sequentially to ensure correct order
            for (const src of scripts) {
                await this.loadScript(src);
            }

            this.envService.logDev('Zoom Meeting SDK loaded successfully');
        } catch (error) {
            this.envService.logError('Failed to initialize Zoom Meeting SDK:', error);
            this.sweetalertService.showError('Failed to initialize Zoom Meeting SDK', 'Zoom Error');
        }
    }

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
     * Set Zoom tokens in the service
     * @param tokenResponse The OAuth token response
     */
    setTokens(tokenResponse: any): void {
        if (tokenResponse) {
            // Store tokens securely
            this.tokenStorage.storeSecurely('zoom_access_token', tokenResponse.access_token);
            this.tokenStorage.storeSecurely('zoom_refresh_token', tokenResponse.refresh_token);
            this.tokenStorage.storeSecurely('zoom_token_expiry', (Date.now() + tokenResponse.expires_in * 1000).toString());

            if (tokenResponse.user_id) {
                this.tokenStorage.storeSecurely('zoom_user_id', tokenResponse.user_id);
            }
        }
    }

    /**
     * Get the current access token, refreshing if needed
     * @returns Observable with the access token
     */
    getAccessToken(): Observable<string> {
        const token = this.tokenStorage.retrieveSecurely('zoom_access_token');
        const expiryStr = this.tokenStorage.retrieveSecurely('zoom_token_expiry');
        const expiry = expiryStr ? parseInt(expiryStr) : 0;

        // Check if token exists and is valid
        if (token && expiry && expiry > Date.now()) {
            return of(token);
        }

        // If we have a refresh token, try to refresh
        const refreshToken = this.tokenStorage.retrieveSecurely('zoom_refresh_token');

        if (refreshToken) {
            return this.refreshAccessToken(refreshToken);
        }

        // If we don't have a refresh token, we need to reauthenticate
        return throwError(() => new Error('No valid access token or refresh token available'));
    }

    /**
     * Refresh the access token using a refresh token
     * @param refreshToken The refresh token
     * @returns Observable with the new access token
     */
    private refreshAccessToken(refreshToken: string): Observable<string> {
        const zoomConfig = this.envService.getZoomConfig();

        // Create Basic Auth header
        const basicAuth = btoa(`${zoomConfig.clientId}:${zoomConfig.clientSecret}`);

        // Set headers
        const headers = new HttpHeaders({
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
        });

        const body = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        return this.http.post<any>('https://zoom.us/oauth/token', body, { headers }).pipe(
            map((response) => {
                // Store the new tokens
                this.setTokens(response);
                return response.access_token;
            }),
            catchError((error) => {
                this.envService.logError('Error refreshing Zoom token:', error);
                this.sweetalertService.showError('Failed to refresh authentication token', 'Zoom Error');
                return throwError(() => error);
            })
        );
    }

    /**
     * Generate a signature for joining a Zoom meeting
     * @param meetingNumber The meeting number
     * @param role The role (0 for attendee, 1 for host)
     * @returns Observable with signature
     */
    private generateSignature(meetingNumber: string, role: number): Observable<string> {
        const url = this.envService.getZoomProxyUrl() + '/signature';

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
     * Create a new Zoom meeting
     * @param topic Meeting topic
     * @param startTime Start time (ISO format)
     * @param duration Duration in minutes
     * @returns Observable with meeting details
     */
    createMeeting(topic: string, startTime: string, duration: number): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap((token) => {
                const url = this.envService.getZoomProxyUrl() + '/meetings';

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
                        auto_recording: 'none'
                    }
                };

                const headers = new HttpHeaders({
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                });

                return this.http.post(url, meetingConfig, { headers });
            }),
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
     * Join a Zoom meeting
     * @param meetingNumber Meeting number/ID
     * @param meetingPassword Meeting password
     * @param displayName User's display name
     * @param elementId DOM element ID where to render the meeting
     */
    async joinMeeting(meetingNumber: string, meetingPassword: string, displayName: string, elementId: string): Promise<void> {
        try {
            // Ensure Zoom SDK is loaded
            if (!(window as any).ZoomMtg) {
                this.sweetalertService.showError('Zoom SDK not loaded', 'Error');
                return;
            }

            const ZoomMtg = (window as any).ZoomMtg;
            const zoomConfig = this.envService.getZoomConfig();

            // Initialize the Zoom Meeting
            ZoomMtg.init({
                leaveUrl: window.location.origin + '/app/session',
                success: async () => {
                    try {
                        // Generate signature - need to await the result
                        const signature = await this.generateSignature(meetingNumber, 0).toPromise();

                        // Join the meeting
                        ZoomMtg.join({
                            meetingNumber: meetingNumber,
                            userName: displayName,
                            signature: signature,
                            apiKey: zoomConfig.apiKey,
                            userEmail: '',
                            passWord: meetingPassword,
                            success: () => {
                                this.envService.logDev('Joined Zoom meeting successfully');
                            },
                            error: (error: any) => {
                                this.envService.logError('Failed to join Zoom meeting:', error);
                                this.sweetalertService.showError('Failed to join Zoom meeting', 'Zoom Error');
                            }
                        });
                    } catch (error) {
                        this.envService.logError('Error generating signature:', error);
                        this.sweetalertService.showError('Failed to generate meeting signature', 'Zoom Error');
                    }
                },
                error: (error: any) => {
                    this.envService.logError('Failed to initialize Zoom meeting:', error);
                    this.sweetalertService.showError('Failed to initialize Zoom meeting', 'Zoom Error');
                }
            });
        } catch (error) {
            this.envService.logError('Error joining Zoom meeting:', error);
            this.sweetalertService.showError('Error joining Zoom meeting', 'Zoom Error');
        }
    }

    /**
     * End a Zoom meeting
     * @param meetingId The meeting ID to end
     */
    endMeeting(meetingId: string): Observable<any> {
        return this.getAccessToken().pipe(
            switchMap((token) => {
                const url = `${this.API_URL}/meetings/${meetingId}/status`;

                const headers = new HttpHeaders({
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                });

                return this.http.put(url, { action: 'end' }, { headers });
            }),
            catchError((error) => {
                this.envService.logError('Error ending Zoom meeting:', error);
                this.sweetalertService.showError('Failed to end Zoom meeting', 'Zoom Error');
                return throwError(() => error);
            })
        );
    }

    /**
     * Check if user is authenticated with Zoom
     */
    isAuthenticated(): boolean {
        const token = this.tokenStorage.retrieveSecurely('zoom_access_token');
        const expiryStr = this.tokenStorage.retrieveSecurely('zoom_token_expiry');
        const expiry = expiryStr ? parseInt(expiryStr) : 0;

        return !!token && expiry > Date.now();
    }

    /**
     * Clear Zoom authentication data
     */
    logout(): void {
        this.tokenStorage.removeSecurely('zoom_access_token');
        this.tokenStorage.removeSecurely('zoom_refresh_token');
        this.tokenStorage.removeSecurely('zoom_token_expiry');
        this.tokenStorage.removeSecurely('zoom_user_id');
    }
}
