import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as moment from 'moment-timezone';
import { User } from '@/ringcentral/messages/entities/user.entity';
import { Message } from '@/ringcentral/messages/entities/message.entity';

export type ChatsDocument = Chats & Document;

@Schema()
export class Chats {

    @Prop()
    credentialId: number;

    @Prop({ default: () => null })
    lastMessage?: Message;

    @Prop()
    credentialPhoneNumber: string;

    @Prop()
    leadPhoneNumber: string;

    @Prop()
    searchPhoneNumber: string;

    @Prop({ default: () => null })
    leadName: string;

    @Prop({ default: () => null })
    leadId: number;

    @Prop({ default: () => null })
    clientAccountId: string;

    @Prop({ default: () => moment.tz('America/Los_Angeles') })
    createdAt: Date;

    @Prop()
    createdBy: User;

    @Prop({ default: () => false })
    isBlocked: Boolean;

    @Prop({ default: () => 0 })
    unreadCount: number;

    @Prop()
    blockedBy: User;

}

const ChatsSchema = SchemaFactory.createForClass(Chats);

ChatsSchema.index({ credentialId: 1 });
ChatsSchema.index({ leadPhoneNumber: 1 });

export { ChatsSchema };