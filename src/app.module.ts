import { Module } from '@nestjs/common';
import { RingcentralModule } from './ringcentral/ringcentral.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsocketsModule } from './websockets/websockets.module';

@Module({
  imports: [
    RingcentralModule,
    MongooseModule.forRoot('mongodb://localhost:27017/ringcentral'),
    WebsocketsModule,
  ],
  controllers: [],
  providers: [WebsocketsModule],
  exports: [WebsocketsModule],
})
export class AppModule { }
