// src/app/pages/session/zoom-meeting/zoom-meeting.component.ts
import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

import { TranslateModule } from '@ngx-translate/core';
import { ZoomMeeting } from '../../models/zoom-meeting.model';
import { ZoomService } from '../../services/zoom.service';

@Component({
    selector: 'app-zoom-meeting',
    standalone: true,
    imports: [CommonModule, ButtonModule, CardModule, FormsModule, TranslateModule],
    template: `
        <div class="p-4">
            <p-card *ngIf="meeting" [header]="meeting.topic">
                <div class="grid">
                    <div class="col-12">
                        <div class="flex flex-column gap-2">
                            <div class="flex justify-content-between align-items-center">
                                <span class="font-semibold">{{ 'pages.session.zoomMeeting' | translate }}</span>
                                <p-button icon="pi pi-external-link" [label]="'pages.session.joinMeeting' | translate" (onClick)="joinMeeting()" styleClass="p-button-sm"> </p-button>
                            </div>

                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <div class="flex flex-column gap-2">
                                        <div>
                                            <span class="font-semibold block">{{ 'pages.session.meetingId' | translate }}:</span>
                                            <span>{{ meeting.meetingNumber }}</span>
                                        </div>

                                        <div>
                                            <span class="font-semibold block">{{ 'pages.session.password' | translate }}:</span>
                                            <span>{{ meeting.password }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 md:col-6">
                                    <div class="flex flex-column gap-2">
                                        <div>
                                            <span class="font-semibold block">{{ 'pages.session.startTime' | translate }}:</span>
                                            <span>{{ meeting.startTime | date: 'medium' }}</span>
                                        </div>

                                        <div>
                                            <span class="font-semibold block">{{ 'pages.session.duration' | translate }}:</span>
                                            <span>{{ meeting.duration }} {{ 'pages.session.minutes' | translate }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3">
                                <div id="zoomMeetingContainer" class="w-full border-1 border-gray-200 rounded-lg min-h-10rem bg-gray-50">
                                    <!-- Zoom meeting will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </p-card>

            <div *ngIf="!meeting" class="text-center p-5">
                <i class="pi pi-video text-6xl text-gray-300 mb-3"></i>
                <p class="text-gray-500">{{ 'pages.session.noMeetingAvailable' | translate }}</p>
            </div>
        </div>
    `,
    styles: [
        `
            .min-h-10rem {
                min-height: 10rem;
            }
        `
    ]
})
export class ZoomMeetingComponent implements OnInit, OnDestroy {
    @Input() meeting: ZoomMeeting | undefined;
    @Input() isHost: boolean = false;
    @Output() meetingJoined = new EventEmitter<boolean>();
    @Output() meetingEnded = new EventEmitter<boolean>();

    private meetingActive = false;

    constructor(private zoomService: ZoomService) {}

    ngOnInit(): void {
        console.log('Zoom meeting component initialized', this.meeting);
    }

    ngOnDestroy(): void {
        // Clean up any active meeting resources
        if (this.meetingActive) {
            this.leaveMeeting();
        }
    }

    joinMeeting(): void {
        if (!this.meeting) {
            console.error('No meeting available to join');
            return;
        }

        // For this example, we'll open the meeting URL in a new tab
        // In a real implementation, you'd want to use the Zoom Web SDK
        // to join the meeting directly in your application

        if (this.isHost) {
            window.open(this.meeting.hostUrl, '_blank');
        } else {
            window.open(this.meeting.joinUrl, '_blank');
        }

        // Mark as active
        this.meetingActive = true;
        this.meetingJoined.emit(true);

        // In a real implementation with the SDK, you would:
        /*
    this.zoomService.joinMeeting(
      this.meeting.meetingNumber,
      this.meeting.password,
      this.isHost ? 'Host User' : 'Attendee User',
      'zoomMeetingContainer'
    );
    */
    }

    leaveMeeting(): void {
        // Clean up any resources when leaving the meeting
        this.meetingActive = false;
        this.meetingEnded.emit(true);

        // In a real implementation, you would:
        // this.zoomService.leaveMeeting();

        // Clear the meeting container
        const container = document.getElementById('zoomMeetingContainer');
        if (container) {
            container.innerHTML = '';
        }
    }
}
