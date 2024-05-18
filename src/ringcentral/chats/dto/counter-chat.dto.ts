import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches, IsIn, ValidateNested, IsOptional } from 'class-validator'
export class CounterChatDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    // @Matches(/^\(\d{3}\)\s\d{3}-\d{4}$/, {
    //     message: 'phoneNumber must be in the format (###) ###-####'
    // })
    phoneNumber: string;

    @ApiProperty()
    @IsNotEmpty()
    credentialId: number;

}
