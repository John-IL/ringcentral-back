import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

import { Attachments } from '@/ringcentral/messages/entities/attachment.entity';
import { MessageDirection } from "@/ringcentral/messages/schema/messages.schema"
import { User } from '@/ringcentral/messages/entities/user.entity';

export class CreateMessageDto {

    @IsNotEmpty()
    @IsString()
    chatId: string;

    @IsString()
    subject: string;

    @IsOptional()
    attachment: [Attachments]

    @ApiProperty({ 
        description: 'Type of chat', 
        enum: MessageDirection,
        example: MessageDirection.OUTBOUND
    })
    @IsNotEmpty()
    @IsIn([MessageDirection.INBOUND, MessageDirection.OUTBOUND])
    direction: MessageDirection;

    @IsOptional()
    createdBy: User
}
