import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MessagesService } from '@/ringcentral/messages/messages.service';
import { MessagesController } from '@/ringcentral/messages/messages.controller';
import { Messages, MessagesSchema } from '@/ringcentral/messages/schema/messages.schema';
import { CommonsModule } from '@/ringcentral/commons/commons.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema
      }
    ]),
    CommonsModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule { }
