import { Module } from '@nestjs/common';

import { RingcentralService } from '@/ringcentral/ringcentral.service';
import { MessagesModule } from '@/ringcentral/messages/messages.module';
import { ChatsModule } from '@/ringcentral/chats/chats.module';
import { CommonsModule } from '@/ringcentral/commons/commons.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
    imports: [
        MessagesModule,
        ChatsModule,
        CommonsModule,

        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 1000,
        }]),
    ],
    providers: [RingcentralService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard
        }
    ],
    exports: [CommonsModule]

})
export class RingcentralModule { }
