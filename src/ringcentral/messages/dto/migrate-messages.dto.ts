import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsIn, IsDateString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class FindMessagesDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    rcToken: string;

    @ApiProperty()
    @IsDateString()
    date: Date;

}
