// src/app/services/redirect.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class RedirectService {
    // Store the last URL to redirect to if needed
    private redirectUrl: string | null = null;

    constructor(
        private router: Router,
        private location: Location
    ) {}

    /**
     * Set a URL to redirect to later
     * @param url The URL to redirect to
     */
    setRedirectUrl(url: string): void {
        this.redirectUrl = url;
    }

    /**
     * Get the stored redirect URL
     * @returns The stored URL or null if none is set
     */
    getRedirectUrl(): string | null {
        return this.redirectUrl;
    }

    /**
     * Clear the stored redirect URL
     */
    clearRedirectUrl(): void {
        this.redirectUrl = null;
    }

    /**
     * Redirect to the stored URL if available, otherwise to the provided fallback
     * @param fallbackUrl URL to redirect to if no stored URL exists
     */
    redirectToStoredUrl(fallbackUrl: string = '/'): void {
        const url = this.redirectUrl || fallbackUrl;
        this.clearRedirectUrl();
        this.router.navigateByUrl(url);
    }

    /**
     * Store current URL for later redirect
     */
    storeCurrentUrl(): void {
        this.redirectUrl = this.router.url;
    }

    /**
     * Handle redirect from external source (like OAuth)
     * @param queryParamName Name of the query param containing the redirect URL
     * @param fallbackUrl URL to redirect to if no redirect param is found
     */
    handleExternalRedirect(queryParamName: string = 'redirect_uri', fallbackUrl: string = '/'): void {
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get(queryParamName);

        if (redirectUrl) {
            // Check if it's a relative URL (for security)
            if (redirectUrl.startsWith('/')) {
                this.router.navigateByUrl(redirectUrl);
            } else {
                // It's an external URL, check if it's allowed
                this.redirectToExternalUrl(redirectUrl);
            }
        } else {
            this.router.navigateByUrl(fallbackUrl);
        }
    }

    /**
     * Redirect to an external URL
     * @param url The external URL to redirect to
     */
    redirectToExternalUrl(url: string): void {
        // Add validation here if needed (whitelist domains, etc.)
        window.location.href = url;
    }

    /**
     * Navigate back to the previous page
     */
    goBack(): void {
        this.location.back();
    }
}
