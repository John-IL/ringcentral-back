import { Module } from '@nestjs/common';
import { ChatsService } from '@/ringcentral/chats/chats.service';
import { ChatsController } from '@/ringcentral/chats/chats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chats, ChatsSchema } from '@/ringcentral/chats/schema/chats.schema';
import {  Messages, MessagesSchema } from '@/ringcentral/messages/schema/messages.schema';
import { WebsocketsModule } from '@/websockets/websockets.module';


@Module({
  imports:[
    WebsocketsModule,

    MongooseModule.forFeature([
      { name: Chats.name, schema: ChatsSchema },
      { name: Messages.name, schema: MessagesSchema}
    ])
  ],

  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService]
})
export class ChatsModule {}
