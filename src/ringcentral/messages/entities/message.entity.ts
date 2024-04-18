import { Attachments } from './attachment.entity'
import { User } from './user.entity'
import { ParticipantRc } from '@/ringcentral/messages/entities/participantRc.entity'
import {  MessageType, MessageReadStatus, MessageDirection, MessageStatus, MessageResources } from '../schema/messages.schema'
import { ObjectId } from 'mongoose';
import { Types } from 'mongoose'


export class Message {
    id: Number;
    conversationId: Number;
    chatId: Types.ObjectId;
    to?: ParticipantRc[];
    from: ParticipantRc;
    type: MessageType;
    creationTime: Date;
    readStatus: MessageReadStatus;
    attachments?: [Attachments];
    direction: MessageDirection;
    subject: string;
    resource?: MessageResources;
    
    createdBy?: User; 
    messageStatus?: MessageStatus;
    readBy?: User;
}
