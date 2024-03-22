import { Injectable } from '@nestjs/common';
import { SDK } from '@ringcentral/sdk';
import { Credential } from './ringcentral.entity'

@Injectable()
export class RingcentralService {

    login = (credential?: Credential) => {

        try {
            const rcsdk = new SDK({
                server: SDK.server.production,
                clientId: process.env.RINGCENTRAL_CLIENT_ID,
                clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET
            });

            if (credential) {
                rcsdk.login(credential);
            } else {
                rcsdk.login({
                    username: process.env.RINGCENTRAL_USERNAME,
                    extension: null,
                    password: process.env.RINGCENTRAL_PASSWORD,
                });
            }
            return rcsdk;
        } catch (e) {
            throw e;
        }
    }
}
