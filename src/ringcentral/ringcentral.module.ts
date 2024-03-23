import { Module } from '@nestjs/common';
import { RingcentralService } from './ringcentral.service';
import { MessagesModule } from './messages/messages.module';
import { ChatsModule } from './chats/chats.module';


@Module({
    imports: [
        MessagesModule,
        ChatsModule
    ],
    providers: [RingcentralService],

})
export class RingcentralModule { }
