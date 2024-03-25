import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonsService {
    async processMessage(){
        return "This is a message from the commons service";
    }
}
