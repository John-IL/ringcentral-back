import { Injectable } from '@nestjs/common';
import { RingcentralService } from '../ringcentral.service';
import { ListMessageDto } from './dto/message.dto';
import { Credential } from '../ringcentral.entity';

@Injectable()
export class MessagesService {
    private ringcentralService: RingcentralService;
    constructor(
    ) {
        this.ringcentralService = new RingcentralService();
    }

    getAll = (request: ListMessageDto) => {
        try {
            const credential: Credential =
            {
                username: request.number,
                extension: request.extension,
                password: request.password
            };

            const rcsdk = this.ringcentralService.login(credential);
            return 1;
        } catch (e) {
            throw e;
        }
    }
    
    create(variable) {
        const rcsdk = this.ringcentralService.login();
    }
    update() { }
    delete() { }
    getById() { }
}
