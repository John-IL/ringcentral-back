import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Messages, MessagesSchema } from './schema/messages.schema';
import { CommonsModule } from '../commons/commons.module'

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
