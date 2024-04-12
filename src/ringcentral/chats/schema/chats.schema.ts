import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as moment from 'moment-timezone'; 
import { Participant } from '@/ringcentral/messages/entities/participant.entity';
import { User } from '@/ringcentral/messages/entities/user.entity';

export enum TypeChat {
    INTERNAL = "INTERNAL",
    LEAD = "LEAD",
    YOU = "YOU",
}

export type ChatsDocument = Chats & Document;

@Schema()
export class Chats {
    @Prop()
    firstParticipant: Participant;

    @Prop()
    secondParticipant: Participant;

    @Prop({ type: String, enum: Object.values(TypeChat) })
    type: TypeChat;

    @Prop({ default: () => moment.tz('America/Los_Angeles') })
    createdAt: Date;

    @Prop()
    createdBy: User;
}

export const ChatsSchema = SchemaFactory.createForClass(Chats);