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
import { ZoomService } from '../../services/zoom.service';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../services/auth.service';

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
            <div id="zmmtg-root"></div>
        </div>
    `
})
export class ZoomMeetingComponent implements OnInit, OnDestroy {
    @Input() meeting: ZoomMeeting | undefined;
    @Input() isHost: boolean = false;
    @Output() meetingJoined = new EventEmitter<boolean>();
    @Output() meetingEnded = new EventEmitter<boolean>();

    loading: boolean = true;
    booking: Booking | null = null;
    meetingActive: boolean = false;

    constructor(
        private zoomService: ZoomService,
        private route: ActivatedRoute,
        private bookingService: BookingService,
        private authService: AuthService
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
    }

    async joinMeeting(): Promise<void> {
        if (!this.meeting) {
            console.error('No meeting data available');
            return;
        }

        try {
            this.meetingActive = true;
            this.meetingJoined.emit(true);

            // Get the current user's display name
            const currentUser = await this.authService.getCurrentUser();
            const displayName = currentUser?.displayName || 'User';

            // Join the meeting
            await this.zoomService.joinMeeting(this.meeting.meetingNumber, this.meeting.password, displayName);
        } catch (error) {
            console.error('Error joining meeting:', error);
            this.meetingActive = false;
            this.meetingJoined.emit(false);
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
