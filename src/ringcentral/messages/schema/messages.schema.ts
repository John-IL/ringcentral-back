import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

export type MessagesDocument = Messages & Document;

@Schema()
export class Messages {
    @Prop({ unique: true })
    id: string;

    @Prop({ unique: true })
    conversationId: string;

    @Prop()
    creationTime: Date;

    @Prop()
    fromModule: string;

    @Prop()
    fromNumber: string;

    @Prop()
    fromName: string;

    @Prop({ type: String, enum: Object.values(MessageDirection) })
    direction: MessageDirection;

    @Prop({ type: String, enum: Object.values(MessageReadStatus) })
    readStatus: MessageReadStatus;

    @Prop({ type: String, enum: Object.values(MessageType) })
    type: MessageType;

    @Prop({ type: String, enum: Object.values(MessageAvailability) })
    availability: MessageAvailability;

    @Prop({ type: String, enum: Object.values(MessageStatus) })
    messageStatus: MessageStatus;

    @Prop({ type: String, enum: Object.values(MessageResources) })
    fromResource: MessageResources;
}

export const MessagesSchema = SchemaFactory.createForClass(Messages);