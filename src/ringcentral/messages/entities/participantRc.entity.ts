import { Number } from "mongoose";
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ParticipantRc {
    
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;
    
    name?: string;
    location?: string;
    leadId?: Number;
    clientAccountId?: string;
}