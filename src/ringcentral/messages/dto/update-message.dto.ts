import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';
import { IsOptional } from 'class-validator';

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
    @ApiProperty()
    @IsOptional()
    highlight: Boolean;

    @ApiProperty()
    @IsOptional()
    important: Boolean;
}
