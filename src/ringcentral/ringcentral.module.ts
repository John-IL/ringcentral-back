import { Module } from '@nestjs/common';

import { RingcentralService } from '@/ringcentral/ringcentral.service';
import { MessagesModule } from '@/ringcentral/messages/messages.module';
import { ChatsModule } from '@/ringcentral/chats/chats.module';
import { CommonsModule } from '@/ringcentral/commons/commons.module';

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
