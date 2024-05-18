import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn, IsNumber, Length } from 'class-validator'
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
    @Length(0, 500, { message: 'The text must have a maximum of 500 characters' })
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
