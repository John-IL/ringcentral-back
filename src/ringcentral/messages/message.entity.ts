enum MessageType {
    FAX = "FAX",
    SMS = "SMS",
    VoiceMail = "VoiceMail",
    Pager = "Pager",
}

enum MessageDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND",
}

enum MessageReadStatus {
    READ = "READ",
    UNREAD = "UNREAD",
}

enum MessageAvailability {
    Alive = "Alive",
    Deleted = "Deleted",
    Purged = "Purged",
}

enum MessageStatus {
    Queued = 'Queued',
    Sent = 'Sent', 
    Delivered = 'Delivered', 
    DeliveryFailed = 'DeliveryFailed', 
    SendingFailed = 'SendingFailed', 
    Received = 'Received'
}


enum MessageResources {
    CHAT = "CHAT",
}


export class Message {
    id: number;
    conversationId: string;
    creationTime: Date;
    fromModule?: number;
    fromNumber: string;
    fromName: string;
    direction: MessageDirection;
    readStatus: MessageReadStatus;
    type: MessageType;
    availability: MessageAvailability;
    messageStatus?:MessageStatus;
    subject: string;
    createdBy?: string;
    fromResource: MessageResources;
    createdAt: Date;
    updatedAt?: Date;

}