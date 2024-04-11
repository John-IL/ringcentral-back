import { Injectable } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto'
@Injectable()
export class CommonsService {


    async  getAllResources(platform: any, url: string, params: Object): Promise<any[]> {
        const allRecords: any[] = [];
        let page = 1;
    
        params['perPage'] = '1000';
    
        while (true) {
            params['page'] = page;
            const apiResponse = await platform.get(url, params);
            // const headers = apiResponse.response().getHeaders();
            const rcRecords = await apiResponse.json();
    
            if (!rcRecords.paging?.pageEnd) {
                break;
            }
    
            allRecords.push(...rcRecords.records);
            ++page;
    
            // if (headers['X-Rate-Limit-Remaining'][0] === '0') {
            //     const timeSleep = parseInt(headers['X-Rate-Limit-Window'][0], 10);
            //     await new Promise(resolve => setTimeout(resolve, timeSleep * 1000));
            // }
        }
        return allRecords;
    }


    async getAllMessages(tokenRc: string, date: Date) {
        const rcsdk = new SDK({
            server: SDK.server.production,
            clientId: process.env.RINGCENTRAL_CLIENT_ID,
            clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
        });

        try {

            const body = {
                //availability: [  ],
                //conversationId: '<ENTER VALUE>',
                //dateFrom: '<ENTER VALUE>',
                //dateTo: '<ENTER VALUE>',
                //page: 000,
                //perPage: 1000,
            };

            const platform = rcsdk.platform();
            
            await platform.login({ jwt: tokenRc });
            const endPoint = "/restapi/v1.0/account/~/extension/~/message-store";
            // const records = await platform.get(endPoint, body);
            const records = await this.getAllResources(platform, endPoint, body);

            return records;

        } catch (e) {
            throw e;
        }
    }

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

        try {
            const platform = rcsdk.platform();

            await platform.login({ jwt: message.tokenRc });
            const response = await platform.post(`/restapi/v1.0/account/~/extension/~/sms`, body);

            return response.json();

        } catch (error) {
            throw error;
        }
    }
}
