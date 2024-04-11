import { Attachments } from './attachment.entity'
import { User } from './user.entity'
import {  MessageType, MessageReadStatus, MessageDirection, MessageStatus, MessageResources } from '../schema/messages.schema'

export class Message {
    conversationId: Number;
    chatId: string;
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
