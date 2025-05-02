// src/app/components/zoom-callback/zoom-callback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ZoomService } from '../../services/zoom.service';
import { SweetalertService } from '../../services/sweetalert.service';
import { TokenStorageService } from '../../services/token-storage.service';
import { environment } from '../../../app/env/env';
import { RedirectService } from '../../services/redirect.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-zoom-callback',
    imports: [ProgressSpinnerModule],
    template: `
        <div class="flex h-full w-full items-center justify-center">
            <p-progressSpinner *ngIf="loading"></p-progressSpinner>
        </div>
    `,
    styles: []
})
export class ZoomCallbackComponent implements OnInit {
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private zoomService: ZoomService,
        private sweetalertService: SweetalertService,
        private tokenStorage: TokenStorageService,
        private redirectService: RedirectService
    ) {}

    ngOnInit(): void {
        // Get the auth code from Zoom
        this.route.queryParams.subscribe((params) => {
            const code = params['code'];
            const state = params['state']; // Optional state parameter for security

            if (code) {
                // Validate state if applicable
                if (state) {
                    const storedState = this.tokenStorage.retrieveSecurely('zoom_auth_state');
                    if (state !== storedState) {
                        this.sweetalertService.showError('Invalid state parameter, possible CSRF attack', 'Security Error');
                        this.redirectService.redirectToStoredUrl('/dashboard');
                        return;
                    }
                }

                // Handle Zoom authentication
                this.handleZoomAuth(code);
            } else {
                this.sweetalertService.showError('No authorization code received from Zoom', 'Authentication Error');
                this.redirectService.redirectToStoredUrl('/dashboard');
            }
        });
    }

    private handleZoomAuth(code: string): void {
        // Get the redirect URI (must match the one used in the initial authorization request)
        const redirectUri = `${window.location.origin}/oauth/zoom/callback`;

        // Create request body
        const body = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri
        };

        // Get client ID and secret from environment variables
        const clientId = environment.zoom.clientId;
        const clientSecret = environment.zoom.clientSecret;

        // Create Basic Auth header
        const basicAuth = btoa(`${clientId}:${clientSecret}`);

        // Set headers
        const headers = new HttpHeaders({
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
        });

        // Make the request to Zoom
        this.http
            .post('https://zoom.us/oauth/token', body, { headers })
            .pipe(
                catchError((error) => {
                    this.loading = false;
                    this.sweetalertService.showError('Failed to exchange code for token', 'Zoom Authentication Error');
                    console.error('Zoom OAuth token error:', error);
                    return throwError(() => error);
                })
            )
            .subscribe((response) => {
                // Store the response securely
                this.storeZoomTokens(response);

                this.loading = false;
                this.sweetalertService.showSuccess('Successfully authenticated with Zoom', 'Success');

                // Redirect back to the stored URL or dashboard
                this.redirectService.redirectToStoredUrl('/dashboard');
            });
    }

    /**
     * Store Zoom tokens securely
     */
    private storeZoomTokens(tokenResponse: any): void {
        // Store complete token response
        this.tokenStorage.storeSecurely('zoom_tokens', tokenResponse);

        // Also store individual fields for easier access
        this.tokenStorage.storeSecurely('zoom_access_token', tokenResponse.access_token);
        this.tokenStorage.storeSecurely('zoom_refresh_token', tokenResponse.refresh_token);
        this.tokenStorage.storeSecurely('zoom_token_expiry', (Date.now() + tokenResponse.expires_in * 1000).toString());

        // Store user-specific info if available
        if (tokenResponse.user_id) {
            this.tokenStorage.storeSecurely('zoom_user_id', tokenResponse.user_id);
        }

        // Also set in ZoomService if needed
        this.zoomService.setTokens(tokenResponse);
    }
}
