import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class SearchMessagesDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    chatId: string;

    @ApiProperty()
    @IsOptional()
    page: number;

    @ApiProperty()
    @IsOptional()
    text: string;
}
