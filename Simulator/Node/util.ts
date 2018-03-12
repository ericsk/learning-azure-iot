import * as iothub from 'azure-iothub';

import { config } from './config';

let iothubRegistry: iothub.Registry = 
    iothub.Registry.fromConnectionString(`HostName=${config.iothub.host};SharedAccessKeyName=${config.iothub.policy};SharedAccessKey=${config.iothub.accessKey}`);

function loadOrCreateDevicesAsync(deviceId: string): Promise<iothub.Device> {
    return new Promise((resolve, reject) => {
        // 試著去註冊該裝置，若有錯誤表示已經有了可以直接用
        iothubRegistry.create({'deviceId': deviceId}, (err, deviceInfo, response) => {
            if (err) {  // 裝置已存在
                iothubRegistry.get(deviceId, (e, dInfo, r) => {
                    resolve(dInfo);
                });
            } else {    // 裝置已註冊
                resolve(deviceInfo);
            }
        });
    });
}

export function initDevicesAsync(): Promise<Array<iothub.Device>> {
    return new Promise((resolve, reject) => {
        let deviceCreationPromises: Array<Promise<any>> = [];

        for (let i = 0; i < config.deviceCount; ++i) {
            deviceCreationPromises.push(loadOrCreateDevicesAsync(`SimulationDevice-${i}`));
        }

        Promise.all(deviceCreationPromises).then((devices) => {
            resolve(devices);
        });
    });
}