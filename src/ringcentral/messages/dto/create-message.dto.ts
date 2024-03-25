import { IsNotEmpty, IsString, IsOptional, IsInt, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer';
import { Attachments } from '../entities/attachment.entity';
import { Participant } from '../entities/participant.entity';

export class CreateMessageDto {

    @IsNotEmpty()
    @IsInt({ message: 'credentialId must be an integer' })
    @Min(1, { message: 'credentialId must be greater than 0' })
    credentialId: Number;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => Participant)
    to: Participant;

    @IsString()
    subject: String;

    @IsOptional()
    attachment: [Attachments]
}
