import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class SearchTopicMessagesDto {
    @ApiProperty()
    @IsNotEmpty()
    messageId: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    perPage: number;
}
