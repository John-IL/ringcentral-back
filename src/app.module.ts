import { Module } from '@nestjs/common';
import { RingcentralModule } from './ringcentral/ringcentral.module';
@Module({
  imports: [RingcentralModule],
  controllers: [],
  providers: [
    
  ],
})
export class AppModule { }
