import { CreateChatDto } from './create-chat.dto';

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';


export class UpdateChatDto extends PartialType(CreateChatDto) {
    
    @ApiProperty()
    isBlocked: Boolean;
}
