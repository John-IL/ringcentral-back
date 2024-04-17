import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';

export class ImportantMessageDto extends PartialType(CreateMessageDto) {

    @ApiProperty()
    chatId: string;

    @ApiProperty()
    messageId: string;

    @ApiProperty()
    important: Boolean;
}
