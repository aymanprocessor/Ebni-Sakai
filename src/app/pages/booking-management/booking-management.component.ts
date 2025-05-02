// // src/app/components/booking-management/booking-management.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';
// import { BookingService } from '../../services/booking.service';
// import { ZoomService } from '../../services/zoom.service';
// import { Booking } from '../../models/booking.model';
// import { RouterModule } from '@angular/router';

// @Component({
//     selector: 'app-booking-management',
//     standalone: true,
//     imports: [CommonModule, TableModule, ButtonModule, ToastModule, RouterModule],
//     providers: [MessageService],
//     template: `
//         <div class="p-4">
//             <p-toast></p-toast>

//             <div class="mb-4">
//                 <h2 class="text-2xl font-bold">Specialist Bookings</h2>
//             </div>

//             <p-table [value]="confirmedBookings" styleClass="p-datatable-sm">
//                 <ng-template pTemplate="header">
//                     <tr>
//                         <th>Client</th>
//                         <th>Date</th>
//                         <th>Time</th>
//                         <th>Status</th>
//                         <th>Zoom Meeting</th>
//                         <th>Actions</th>
//                     </tr>
//                 </ng-template>
//                 <ng-template pTemplate="body" let-booking>
//                     <tr>
//                         <td>{{ booking.userName }}</td>
//                         <td>{{ booking.timeSlot?.startTime | date: 'mediumDate' }}</td>
//                         <td>{{ booking.timeSlot?.startTime | date: 'shortTime' }} - {{ booking.timeSlot?.endTime | date: 'shortTime' }}</td>
//                         <td>
//                             <span class="badge bg-success text-white" *ngIf="booking.status === 'confirmed'">Confirmed</span>
//                             <span class="badge bg-warning text-white" *ngIf="booking.status === 'pending'">Pending</span>
//                             <span class="badge bg-danger text-white" *ngIf="booking.status === 'cancelled'">Cancelled</span>
//                         </td>
//                         <td>
//                             <span *ngIf="booking.hasZoomMeeting">
//                                 <a [routerLink]="['/zoom-meeting', booking.zoomMeetingId]" class="text-blue-500"> Join Meeting </a>
//                             </span>
//                             <span *ngIf="!booking.hasZoomMeeting">No meeting</span>
//                         </td>
//                         <td>
//                             <button pButton icon="pi pi-video" class="p-button-success p-button-sm mr-2" (click)="createZoomMeeting(booking)" *ngIf="!booking.hasZoomMeeting && booking.status === 'confirmed'" pTooltip="Create Zoom Meeting"></button>
//                         </td>
//                     </tr>
//                 </ng-template>
//             </p-table>

//             <div class="mt-4">
//                 <button pButton label="Create Meetings for All Confirmed Bookings" icon="pi pi-video" (click)="createBulkMeetings()" [disabled]="!hasConfirmedBookingsWithoutMeetings" class="p-button-success"></button>
//             </div>
//         </div>
//     `
// })
// export class BookingManagementComponent implements OnInit {
//     confirmedBookings: Booking[] = [];

//     constructor(
//         private bookingService: BookingService,
//         private zoomService: ZoomService,
//         private messageService: MessageService
//     ) {}

//     ngOnInit(): void {
//         this.loadBookings();
//     }

//     loadBookings(): void {
//         this.bookingService.getSpecialistBookings().subscribe((bookings) => {
//             // Filter for confirmed bookings
//             this.confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
//         });
//     }

//     createZoomMeeting(booking: Booking): void {
//         this.zoomService.createMeetingForBooking(booking).subscribe({
//             next: (result) => {
//                 this.messageService.add({
//                     severity: 'success',
//                     summary: 'Success',
//                     detail: 'Zoom meeting created successfully'
//                 });
//                 // Refresh bookings
//                 this.loadBookings();
//             },
//             error: (err) => {
//                 this.messageService.add({
//                     severity: 'error',
//                     summary: 'Error',
//                     detail: 'Failed to create Zoom meeting: ' + err.message
//                 });
//             }
//         });
//     }

//     createBulkMeetings(): void {
//         const bookingsWithoutMeetings = this.confirmedBookings.filter((b) => !b.hasZoomMeeting);

//         if (bookingsWithoutMeetings.length === 0) {
//             this.messageService.add({
//                 severity: 'info',
//                 summary: 'Info',
//                 detail: 'No bookings without meetings found'
//             });
//             return;
//         }

//         this.zoomService.createBulkMeetings(bookingsWithoutMeetings).subscribe({
//             next: (results) => {
//                 this.messageService.add({
//                     severity: 'success',
//                     summary: 'Success',
//                     detail: `Created ${results.length} Zoom meetings`
//                 });
//                 this.loadBookings();
//             },
//             error: (err) => {
//                 this.messageService.add({
//                     severity: 'error',
//                     summary: 'Error',
//                     detail: 'Failed to create bulk meetings: ' + err.message
//                 });
//             }
//         });
//     }

//     get hasConfirmedBookingsWithoutMeetings(): boolean {
//         return this.confirmedBookings.some((b) => !b.hasZoomMeeting);
//     }
// }
