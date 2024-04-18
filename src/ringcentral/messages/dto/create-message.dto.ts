import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn, isNumber, IsNumber } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

import { Attachments } from '@/ringcentral/messages/entities/attachment.entity';
import { MessageDirection } from "@/ringcentral/messages/schema/messages.schema"
import { User } from '@/ringcentral/messages/entities/user.entity';
import { Type } from 'class-transformer';

export class CreateMessageDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    chatId: string;

    @ApiProperty()
    @IsString()
    subject: string;

    @ApiProperty()
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

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => User)
    createdBy: User;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    tokenRc: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    fromNumber: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    toNumber: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    withImage: Number;

}
