import { IsNotEmpty, IsString, MinLength, IsDateString, IsIn } from 'class-validator'
import { Type } from '../schema/chats.schema'

export class CreateChatDto {

    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    firstNumber: String;

    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    secondNumber: String;

    @IsNotEmpty()
    @IsIn([Type.INTERNAL, Type.LEAD, Type.YOU])
    type: Type;

    @IsNotEmpty()
    @IsDateString()
    creationTime: Date;
}
