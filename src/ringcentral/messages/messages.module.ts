import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MessagesService } from '@/ringcentral/messages/messages.service';
import { MessagesController } from '@/ringcentral/messages/messages.controller';
import { Messages, MessagesSchema } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsModule } from '@/ringcentral/commons/commons.module'
import { ChatsModule } from '@/ringcentral/chats/chats.module';
import { WebsocketsModule } from '@/websockets/websockets.module';
import { Chats, ChatsSchema } from '@/ringcentral/chats/schema/chats.schema';
import { CommonsModule as CommonsModuleGeneral } from '@/commons/commons.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema
      },
      { name: Chats.name, schema: ChatsSchema },
    ]),
    CommonsModule,
    ChatsModule,
    WebsocketsModule,
    CommonsModuleGeneral
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule { }
