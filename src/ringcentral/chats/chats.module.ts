import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chats, ChatsSchema } from './schema/chats.schema';
import {  Messages, MessagesSchema } from '../messages/schema/messages.schema';

@Module({
  imports:[
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
