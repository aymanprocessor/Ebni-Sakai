export interface ZoomMeeting {
    id: string;
    meetingNumber: string;
    password: string;
    joinUrl: string;
    hostUrl?: string;
    topic: string;
    startTime: Date;
    duration: number;
}
