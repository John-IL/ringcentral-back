import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose'
import { Document } from 'mongoose';
import * as moment from 'moment-timezone'; 

import { Attachments } from '@/ringcentral/messages/entities/attachment.entity';
import { User } from '@/ringcentral/messages/entities/user.entity';
import { ParticipantRc } from '@/ringcentral/messages/entities/participantRc.entity'

export enum MessageType {
    FAX = "FAX",
    SMS = "SMS",
    VoiceMail = "VoiceMail",
    Pager = "Pager",
}

export enum MessageDirection {
    INBOUND = "Inbound",
    OUTBOUND = "Outbound",
}

export enum MessageReadStatus {
    READ = "Read",
    UNREAD = "Unread",
}

export enum MessageStatus {
    Queued = 'Queued',
    Sent = 'Sent', 
    Delivered = 'Delivered', 
    DeliveryFailed = 'DeliveryFailed', 
    SendingFailed = 'SendingFailed', 
    Received = 'Received'
}

export enum MessageResources {
    MIGRATION = 'Migration',
    CHAT = "Chat",
}

export type MessagesDocument = Messages & Document;

@Schema()
export class Messages {

    @Prop()
    id: Number;

    @Prop()
    conversationId: Number;

    @Prop({ type: Types.ObjectId, ref: 'chats' })
    chatId: Types.ObjectId;

    @Prop()
    to: ParticipantRc[];

    @Prop()
    from: ParticipantRc;

    @Prop({ type: String, enum: Object.values(MessageType) })
    type: MessageType;

    @Prop()
    creationTime: Date;

    @Prop({ type: String, enum: Object.values(MessageReadStatus) })
    readStatus: MessageReadStatus;

    @Prop()
    attachments: [Attachments]

    @Prop({ type: String, enum: Object.values(MessageDirection) })
    direction: MessageDirection;
    
    @Prop()
    subject: String;
    
    @Prop({ type: String, enum: Object.values(MessageStatus) })
    messageStatus: MessageStatus;

    @Prop({ type: String, enum: Object.values(MessageResources), default: MessageResources.MIGRATION })
    resource: MessageResources;

    @Prop()
    createdBy: User;

    @Prop()
    readBy: User;

    @Prop({ default: () => moment.tz('America/Los_Angeles') })
    createdAt: Date;

    @Prop({  default: () => false })
    highlight: Boolean;

    @Prop({  default: () => false })
    important: Boolean;

}

export const MessagesSchema = SchemaFactory.createForClass(Messages);