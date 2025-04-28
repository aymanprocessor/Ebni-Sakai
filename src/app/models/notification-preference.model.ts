// src/app/models/notification-preferences.model.ts
export interface NotificationPreferences {
    userId: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    notificationTypes: {
        bookingUpdates: boolean;
        sessionReminders: boolean;
        systemAnnouncements: boolean;
        childProgress: boolean;
        paymentUpdates: boolean;
    };
    quietHours?: {
        enabled: boolean;
        start: string; // "HH:mm" format
        end: string; // "HH:mm" format
    };
}
