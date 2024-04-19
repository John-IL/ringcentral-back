import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class FindMessagesDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    chatId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    column: string;

    @ApiProperty()
    @IsNotEmpty()
    value: any;

    @ApiProperty()
    @IsOptional()
    limit: number;
}
