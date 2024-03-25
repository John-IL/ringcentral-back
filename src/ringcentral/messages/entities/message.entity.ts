import { Types } from 'mongoose'
import { Attachments } from './attachment.entity'
import { Participant } from './participant.entity'
import { User } from './user.entity'
import {  MessageType, MessageReadStatus, MessageDirection, MessageStatus, MessageResources } from '../schema/messages.schema'

export class Message {
    conversationId: String;
    chatId: Types.ObjectId;
    to: Participant;
    from: Participant;
    type: MessageType;
    creationTime: Date;
    readStatus: MessageReadStatus;
    attachments?: [Attachments];
    direction: MessageDirection;
    subject: String;
    messageStatus: MessageStatus;
    resource: MessageResources;
    createdBy?: User;
    readBy?: User;
}
