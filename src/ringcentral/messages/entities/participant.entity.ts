import { Number } from "mongoose";
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class Participant {

    @IsString()
    @IsNotEmpty()
    @Matches(/^\(\d{3}\)\s\d{3}-\d{4}$/, {
        message: 'phoneNumber must be in the format (###) ###-####'
    })
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    searchPhoneNumber: string;

    name?: string;

    leadId?: Number;
    clientAccountId?: string;
}