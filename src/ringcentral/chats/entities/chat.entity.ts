import { User } from '@/ringcentral/messages/entities/user.entity';
import { Message } from '@/ringcentral/messages/entities/message.entity';

export class Chat {
    id: string;
    firstNumber: string;
    secondNumber: string;
    creationDate: Date;
    createdBy?: User;
    isBlocked?: Boolean;
    blockedBy?: User;
    readBy?: User;

    lastMessage?: Message;
    unreadCount?: number;
}
