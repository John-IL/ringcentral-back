import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Type {
    INTERNAL = "INTERNAL",
    LEAD = "LEAD",
    YOU = "YOU",
}

export type ChatsDocument = Chats & Document;

@Schema()
export class Chats {
    @Prop()
    firstNumber: string;

    @Prop()
    secondNumber: string;

    @Prop({ type: String, enum: Object.values(Type) })
    type: Type;

    @Prop()
    creationTime: Date;
}

export const ChatsSchema = SchemaFactory.createForClass(Chats);