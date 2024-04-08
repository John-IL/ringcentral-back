import { IsNotEmpty, IsString, MinLength, IsDateString, IsIn } from 'class-validator'
import { Type } from '../schema/chats.schema'
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatDto {

    @ApiProperty({ description: 'first number', example: '(636) 324-2342' })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    firstNumber: String;

    @ApiProperty({ description: 'second number', example: '(800) 222-1111' })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    secondNumber: String;

    @ApiProperty({ 
        description: 'Type of chat', 
        enum: Type,
        example: Type.INTERNAL
    })
    @IsNotEmpty()
    @IsIn([Type.INTERNAL, Type.LEAD, Type.YOU])
    type: Type;

    @ApiProperty({ description: 'Creation time of the chat', example: '2024-03-28 12:00:00' })
    @IsNotEmpty()
    @IsDateString()
    creationTime: Date;
}
