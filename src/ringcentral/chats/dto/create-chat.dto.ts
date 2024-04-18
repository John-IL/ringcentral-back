import { IsNotEmpty, IsString, MinLength, Matches, IsIn, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';
import { Participant } from '@/ringcentral/messages/entities/participant.entity';
import { Type } from 'class-transformer';

import { TypeChat } from "@/ringcentral/chats/schema/chats.schema"
import { User } from '@/ringcentral/messages/entities/user.entity';
export class CreateChatDto {

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Participant)
    firstParticipant: Participant;

    @ApiProperty()
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Participant)
    secondParticipant: Participant;

    @ApiProperty({ 
        description: 'Type of chat', 
        enum: TypeChat,
        example: TypeChat.INTERNAL
    })
    @IsNotEmpty()
    @IsIn([TypeChat.INTERNAL, TypeChat.LEAD, TypeChat.YOU])
    type: TypeChat;

    @ApiProperty()
    createdBy?: User;
}
