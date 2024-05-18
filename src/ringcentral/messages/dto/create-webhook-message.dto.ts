import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn, isNumber, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

import { Attachments } from '@/ringcentral/messages/entities/attachment.entity';
import { User } from '@/ringcentral/messages/entities/user.entity'
import { ParticipantRc } from '@/ringcentral/messages/entities/participantRc.entity'
import { MessageType, MessageReadStatus, MessageDirection, MessageStatus, MessageResources } from '@/ringcentral/messages/schema/messages.schema'
import { Types } from 'mongoose'

export class CreateWebhookMessageDto {

    @IsNotEmpty()
    id: Number;

    @IsNotEmpty()
    conversationId: Number;
    
    @IsOptional()
    to?: ParticipantRc[];

    @IsOptional()
    chatId?: Types.ObjectId;
    
    @IsNotEmpty()
    from: ParticipantRc;

    @IsNotEmpty()
    type: MessageType;
    
    @IsNotEmpty()
    creationTime: Date;
    
    @IsNotEmpty()
    readStatus: MessageReadStatus;
    
    attachments?: [Attachments];
    
    @IsNotEmpty()
    direction: MessageDirection;
    
    @IsNotEmpty()
    subject: string;

    resource?: MessageResources;

    messageStatus?: MessageStatus;

}
