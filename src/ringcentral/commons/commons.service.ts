import { Injectable } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto'
@Injectable()
export class CommonsService {

    async processMessage(message: CreateMessageDto) {
        const rcsdk = new SDK({
            server: SDK.server.production,
            clientId: process.env.RINGCENTRAL_CLIENT_ID,
            clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
        });

        let parsedPhoneNumber = message.toNumber.replace(/\D/g, ''); 

        const body = {
            from: {
                phoneNumber: message.fromNumber
            },
            to: [
                {
                    phoneNumber: "1" + parsedPhoneNumber
                },
            ],
            text: message.subject,
        };

        try{
            const platform = rcsdk.platform();
            
            await platform.login({ jwt: message.tokenRc });
            const response = await platform.post(`/restapi/v1.0/account/~/extension/~/sms`, body);

            return response.json();
            
        } catch (error){
            throw error;
        }
    }
}
