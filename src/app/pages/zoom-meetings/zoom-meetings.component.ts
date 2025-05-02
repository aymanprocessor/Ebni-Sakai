import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TranslateModule } from '@ngx-translate/core';
import { ZoomMeeting } from '../../models/zoom-meeting.model';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { switchMap } from 'rxjs/operators';
import { Booking } from '../../models/booking.model';
import { environment } from '../../../environments/env.dev';
import { ZoomService } from '../../services/zoom.service';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
    selector: 'app-zoom-meeting',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, FormsModule, TranslateModule, TagModule, ProgressSpinnerModule],
    template: `
        <div class="p-4 max-w-5xl mx-auto">
            <div *ngIf="loading" class="flex justify-center my-8">
                <p-progressSpinner strokeWidth="4"></p-progressSpinner>
            </div>

            <p-card *ngIf="!loading && meeting" [header]="meeting.topic" styleClass="mb-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold m-0">{{ 'pages.session.zoomMeeting' | translate }}</h2>
                    <p-button
                        icon="pi pi-video"
                        [label]="meetingJoined ? ('pages.session.leaveMeeting' | translate) : ('pages.session.joinMeeting' | translate)"
                        (onClick)="meetingJoined ? leaveMeeting() : joinMeeting()"
                        [severity]="meetingJoined ? 'danger' : 'success'"
                    >
                    </p-button>
                </div>

                <div *ngIf="!meetingJoined" class="grid">
                    <div class="col-12 md:col-6">
                        <div class="flex flex-col gap-3">
                            <div>
                                <span class="font-semibold block">{{ 'pages.session.meetingId' | translate }}:</span>
                                <span class="text-lg">{{ meeting.meetingNumber }}</span>
                            </div>
                            <div>
                                <span class="font-semibold block">{{ 'pages.session.password' | translate }}:</span>
                                <span class="text-lg">{{ meeting.password }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 md:col-6">
                        <div class="flex flex-col gap-3">
                            <div>
                                <span class="font-semibold block">{{ 'pages.session.startTime' | translate }}:</span>
                                <span>{{ meeting.startTime | date: 'medium' }}</span>
                            </div>
                            <div>
                                <span class="font-semibold block">{{ 'pages.session.duration' | translate }}:</span>
                                <span>{{ meeting.duration }} {{ 'pages.session.minutes' | translate }}</span>
                            </div>
                            <div *ngIf="booking">
                                <span class="font-semibold block">{{ 'pages.session.status' | translate }}:</span>
                                <p-tag [value]="booking.status" [severity]="getStatusSeverity(booking.status)"></p-tag>
                            </div>
                        </div>
                    </div>
                </div>
            </p-card>

            <div *ngIf="!loading && !meeting" class="text-center p-8 bg-white rounded-lg shadow">
                <i class="pi pi-exclamation-circle text-6xl text-yellow-500 mb-4"></i>
                <h3 class="text-2xl font-semibold mb-2">{{ 'pages.session.noMeetingAvailable' | translate }}</h3>
                <p class="text-gray-600 mb-4">{{ 'pages.session.noMeetingMessage' | translate }}</p>
                <p-button label="{{ 'common.buttons.back' | translate }}" icon="pi pi-arrow-left" routerLink="/dashboard"></p-button>
            </div>

            <!-- Zoom meeting container -->
            <div #zoomContainer id="zoomContainer" class="w-full mt-4 rounded-lg overflow-hidden" [ngClass]="{ 'min-h-96': meetingJoined }" [ngStyle]="{ display: meetingJoined ? 'block' : 'none' }"></div>
        </div>
    `,
    styles: [
        `
            .min-h-96 {
                min-height: 24rem;
            }
        `
    ]
})
export class ZoomMeetingComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() meeting: ZoomMeeting | undefined;
    @Input() isHost: boolean = false;
    @Output() meetingJoined = new EventEmitter<boolean>();
    @Output() meetingEnded = new EventEmitter<boolean>();
    @ViewChild('zoomContainer') zoomContainer!: ElementRef;

    loading: boolean = true;
    booking: Booking | null = null;
    meetingActive: boolean = false;
    zoomSDKLoaded: boolean = false;

    constructor(
        private zoomService: ZoomService,
        private route: ActivatedRoute,
        private bookingService: BookingService
    ) {}

    ngOnInit(): void {
        // Load meeting data from route params if not provided via Input
        if (!this.meeting) {
            this.route.params
                .pipe(
                    switchMap((params) => {
                        const bookingId = params['id'];
                        if (bookingId) {
                            return this.bookingService.getBookingById(bookingId);
                        }
                        return [];
                    })
                )
                .subscribe({
                    next: (booking) => {
                        if (booking) {
                            this.booking = booking;
                            this.meeting = booking.zoomMeeting;
                            this.isHost = this.zoomService.isCurrentUserHost(booking);
                        }
                        this.loading = false;
                    },
                    error: (error) => {
                        console.error('Error loading booking:', error);
                        this.loading = false;
                    }
                });
        } else {
            this.loading = false;
        }

        this.loadZoomSDK();
    }

    ngAfterViewInit(): void {
        if (this.zoomSDKLoaded) {
            this.initializeZoomContainer();
        }
    }

    async loadZoomSDK(): Promise<void> {
        try {
            if (!document.getElementById('zoom-sdk')) {
                const scripts = [
                    { src: 'https://source.zoom.us/2.18.0/lib/vendor/react.min.js', id: 'zoom-react' },
                    { src: 'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js', id: 'zoom-react-dom' },
                    { src: 'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js', id: 'zoom-redux' },
                    { src: 'https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js', id: 'zoom-redux-thunk' },
                    { src: 'https://source.zoom.us/zoom-meeting-2.18.0.min.js', id: 'zoom-sdk' }
                ];

                for (const script of scripts) {
                    await this.loadScript(script.src, script.id);
                }
            }

            this.zoomSDKLoaded = true;
            this.initializeZoomContainer();
        } catch (error) {
            console.error('Failed to load Zoom SDK:', error);
        }
    }

    loadScript(src: string, id: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (document.getElementById(id)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.id = id;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
        });
    }

    initializeZoomContainer(): void {
        if (!this.zoomContainer || !this.zoomSDKLoaded) return;
        console.log('Zoom container initialized');
    }

    async joinMeeting(): Promise<void> {
        if (!this.meeting) {
            console.error('No meeting data available');
            return;
        }

        try {
            const ZoomMtg = (window as any).ZoomMtg;

            // Initialize Zoom
            ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
            ZoomMtg.preLoadWasm();
            ZoomMtg.prepareWebSDK();

            // Set language
            ZoomMtg.i18n.load('en-US');
            ZoomMtg.i18n.reload('en-US');

            // Generate signature
            const signature = await this.zoomService.generateSignature(this.meeting.meetingNumber, this.isHost ? 1 : 0).toPromise();

            const apiKey = environment.zoom.clientId;

            // Initialize and join meeting
            ZoomMtg.init({
                leaveUrl: window.location.origin + '/dashboard',
                disableCORP: true,
                disablePreview: false,
                success: () => {
                    ZoomMtg.join({
                        meetingNumber: this.meeting!.meetingNumber,
                        signature: signature,
                        userName: 'User', // Get from user profile
                        apiKey: apiKey,
                        passWord: this.meeting!.password,
                        success: () => {
                            console.log('Joined meeting successfully');
                            this.meetingActive = true;
                            this.meetingJoined.emit(true);
                        },
                        error: (error: any) => {
                            console.error('Failed to join meeting:', error);
                        }
                    });
                },
                error: (error: any) => {
                    console.error('Failed to initialize Zoom:', error);
                }
            });
        } catch (error) {
            console.error('Error joining meeting:', error);
        }
    }

    leaveMeeting(): void {
        if (this.meetingActive && (window as any).ZoomMtg) {
            (window as any).ZoomMtg.leaveMeeting({
                success: () => {
                    this.meetingActive = false;
                    this.meetingEnded.emit(true);
                }
            });
        }
    }

    getStatusSeverity(status: string): string {
        switch (status) {
            case 'confirmed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'danger';
            case 'completed':
                return 'info';
            default:
                return 'info';
        }
    }

    ngOnDestroy(): void {
        if (this.meetingActive) {
            this.leaveMeeting();
        }
    }
}
