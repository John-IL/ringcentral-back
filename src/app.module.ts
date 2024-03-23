import { Module } from '@nestjs/common';
import { RingcentralModule } from './ringcentral/ringcentral.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    RingcentralModule,
    MongooseModule.forRoot('mongodb://localhost:27017/ringcentral'),
  ],
  controllers: [],
  providers: [

  ],
})
export class AppModule { }
