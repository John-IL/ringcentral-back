import { Number } from "mongoose";
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class Participant {
    
    @IsString()
    @IsNotEmpty()
    @Matches(/^\(\d{3}\)\s\d{3}-\d{4}$/, {
        message: 'phoneNumber must be in the format (###) ###-####'
    })
    phoneNumber: String;
    
    name?: String;
    location?: String;
    leadId?: Number;
    clientAccountId?: String;
}