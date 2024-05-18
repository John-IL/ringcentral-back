import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches, IsIn, ValidateNested, IsOptional } from 'class-validator'

export class FindClientChatDto {
    
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @Matches(/^\(\d{3}\)\s\d{3}-\d{4}$/, {
        message: 'modulePhoneNumber must be in the format (###) ###-####'
    })
    modulePhoneNumber: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    // @Matches(/^\(\d{3}\)\s\d{3}-\d{4}$/, {
    //     message: 'clientPhoneNumber must be in the format (###) ###-####'
    // })
    clientPhoneNumber: string;

  
}
