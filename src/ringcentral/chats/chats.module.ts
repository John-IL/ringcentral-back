import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Chats, ChatsSchema } from './schema/chats.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      {
        name: Chats.name,
        schema: ChatsSchema
      }
    ])
  ],

  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
