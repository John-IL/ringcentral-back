import { IsNotEmpty, IsString, Length, IsOptional, IsDateString, IsDate } from 'class-validator'

export class CreateMessageDto {
    fromNumber: string
}

export class ListMessageDto {
    @IsString()
    @IsNotEmpty()
    @Length(11, 11, { message: "number must be equal to 11 characters" })
    number: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 3, { message: "number must be equal to 3 characters" })
    extension: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    @IsDateString()
    date: Date;
}
