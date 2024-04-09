import { IsNotEmpty, IsString, MinLength, Matches, IsIn, ValidateNested } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';
import { Participant } from '@/ringcentral/messages/entities/participant.entity';
import { Type } from 'class-transformer';
import { TypeChat } from "@/ringcentral/chats/schema/chats.schema"

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
    typeChat: TypeChat;
}
