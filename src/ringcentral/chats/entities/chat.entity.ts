import { User } from '@/ringcentral/messages/entities/user.entity';

export class Chat {
    id: String;
    firstNumber: String;
    secondNumber: String;
    creationDate: Date;
    createdBy: User
}
