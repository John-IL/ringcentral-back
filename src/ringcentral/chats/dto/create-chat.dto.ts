import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

import { User } from '@/ringcentral/messages/entities/user.entity';
export class CreateChatDto {

    @ApiProperty()
    @IsString()
    firstNumber: string;

    @ApiProperty()
    @IsString()
    secondNumber: string;

    @IsOptional()
    credentialId?: number;

    @IsOptional()
    @IsString()
    credentialPhoneNumber?: string;

    @IsOptional()
    @IsString()
    leadPhoneNumber?: string;

    @IsOptional()
    @IsString()
    searchPhoneNumber?: string;

    @IsOptional()
    @IsString()
    leadName?: string;

    @IsOptional()
    leadId?: number;

    @IsOptional()
    @ApiProperty()
    createdBy?: User;
}
