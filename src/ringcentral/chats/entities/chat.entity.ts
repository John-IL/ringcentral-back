import { User } from '@/ringcentral/messages/entities/user.entity';

export class Chat {
    id: string;
    firstNumber: string;
    secondNumber: string;
    creationDate: Date;
    createdBy: User;
    isBlocked?: Boolean;
}
