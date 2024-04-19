import { Module } from '@nestjs/common';
import { RingcentralModule } from './ringcentral/ringcentral.module';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsocketsModule } from './websockets/websockets.module';
import * as dotenv from 'dotenv';


dotenv.config();

@Module({
  imports: [
    RingcentralModule,
    MongooseModule.forRoot(process.env.DB_URI),
    WebsocketsModule,
  ],
  controllers: [],
  providers: [WebsocketsModule],
  exports: [WebsocketsModule],
})
export class AppModule { }
