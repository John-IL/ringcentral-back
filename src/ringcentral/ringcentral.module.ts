import { Module } from '@nestjs/common';
import { MessagesModule } from './messages/messages.module';
import { RingcentralService } from './ringcentral.service';

@Module({
    imports: [MessagesModule],
    providers: [RingcentralService],

})
export class RingcentralModule { }
