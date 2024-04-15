import { User } from '@/ringcentral/messages/entities/user.entity';
import { CreateChatDto } from './create-chat.dto';

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { MessageReadStatus } from '@/ringcentral/messages/schema/messages.schema';


export class UpdateChatDto extends PartialType(CreateChatDto) {

    @ApiProperty()
    @IsOptional()
    isBlocked: Boolean;

    @ApiProperty()
    @IsOptional()
    blockedBy: User

    @ApiProperty()
    @IsOptional()
    readBy: User

    @ApiProperty()
    @IsOptional()
    readStatus: MessageReadStatus
}
