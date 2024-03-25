import { Module } from '@nestjs/common';
import { RingcentralService } from './ringcentral.service';
import { MessagesModule } from './messages/messages.module';
import { ChatsModule } from './chats/chats.module';
import { CommonsModule } from './commons/commons.module';

@Module({
    imports: [
        MessagesModule,
        ChatsModule,
        CommonsModule
    ],
    providers: [RingcentralService],
    exports: [CommonsModule]

})
export class RingcentralModule { }
