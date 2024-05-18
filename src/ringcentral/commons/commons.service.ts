import { Injectable } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { CreateMessageDto } from '@/ringcentral/messages/dto/create-message.dto'
import { Message } from '@/ringcentral/messages/entities/message.entity';
import * as FormDataRc from 'form-data';
@Injectable()
export class CommonsService {

    async getAllMessages(tokenRc: string, dateT: Date): Promise<Message[]> {
        try {

            const rcsdk = new SDK({
                server: SDK.server.production,
                clientId: process.env.RINGCENTRAL_CLIENT_ID,
                clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
              });
              const platform = rcsdk.platform();
              await platform.login({ jwt: tokenRc });

            const dateF: string = new Date(new Date(dateT).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const dateFrom: string = dateF + 'T07:00:00Z';
            const dateTo: string = dateT + 'T07:00:00Z';

            const body = {
                dateFrom,
                dateTo
            };

            const endPoint = "/restapi/v1.0/account/~/extension/~/message-store";

            const allRecords: Message[] = [];
            let page = 1;


            body['perPage'] = '1000';

            while (true) {
                body['page'] = page;
                const apiResponse = await platform.get(endPoint, body);
                const rcRecords = await apiResponse.json();
                const headers = apiResponse.headers;

                allRecords.push(...rcRecords.records);
                ++page;

                if (!rcRecords.paging?.pageEnd) {
                    break;
                }

                if (headers.get('x-rate-limit-remaining') == '1') {
                    await new Promise(resolve => setTimeout(resolve, 60));
                }
            }

            return allRecords;

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
                    // phoneNumber: "16263467630"
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


    async processMessageFile(message: CreateMessageDto) {
        const rcsdk = new SDK({
            server: SDK.server.production,
            clientId: process.env.RINGCENTRAL_CLIENT_ID,
            clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
        });

        // import * as FormDataRc from 'form-data';
        let formData = new FormDataRc();
        let parsedPhoneNumber = message.toNumber.replace(/\D/g, '');

        var bodyParams = {
            from: { phoneNumber: message.fromNumber },
            to: [{
                phoneNumber: "1" + parsedPhoneNumber
                // phoneNumber: "16263467630"
            }],
            text: message.subject,
        }

        formData.append('json', Buffer.from(JSON.stringify(bodyParams)), {
            contentType: 'application/json'
        });

        for (const file of message.attachment) {
            const base64Data = file.base64.split(',')[1];

            formData.append('attachment', Buffer.from(base64Data, 'base64'), {
                filename: file.name,
                contentType: file.fileType
            });
        }

        try {
            const platform = rcsdk.platform();
            await platform.login({ jwt: message.tokenRc });
            const response = await platform.post(`/restapi/v1.0/account/~/extension/~/sms`, formData);

            return response.json();

        } catch (error) {
            throw error;
        }
    }

    formatPhoneNumber(phoneNumber: string): string {
        phoneNumber = phoneNumber.replace(/^\+1/, '');

        const areaCode: string = phoneNumber.substr(0, 3);
        const restOfNumber: string = phoneNumber.substr(3);

        const formattedPhoneNumber = `(${areaCode}) ${restOfNumber.substr(0, 3)}-${restOfNumber.substr(3)}`;

        return formattedPhoneNumber;
    }

    revertFormatPhoneNumber(numero: string): string {
        const onlyNumbers = numero.replace(/\D/g, '');

        if (onlyNumbers.length === 10) {
            return '1' + onlyNumbers;
        }

        if (onlyNumbers.length === 11 && onlyNumbers.charAt(0) !== '1') {
            return onlyNumbers;
        }

        return 'Number not valid';
    }
}
