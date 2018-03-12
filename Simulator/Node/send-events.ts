import * as iothub from 'azure-iothub';
import * as iotDeviceMqtt from 'azure-iot-device-mqtt';
import * as iotDevice from 'azure-iot-device';
import * as dateformat from 'dateformat';

import { config } from './config';

let iothubRegistry: iothub.Registry = iothub.Registry.fromConnectionString(config.iothub.connectionString);

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

function initDevicesAsync(): Promise<Array<iothub.Device>> {
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

initDevicesAsync()
    .then((devices: Array<iothub.Device>) => {
        for (let i = 0; i < devices.length; ++i) {
            let deviceConnectionString: string = `HostName=${config.iothub.host};DeviceId=${devices[i].deviceId};SharedAccessKey=${devices[i].authentication.symmetricKey.primaryKey}`;
            let deviceClient: iotDevice.Client = iotDeviceMqtt.clientFromConnectionString(deviceConnectionString);

            // 每一秒送一次資料
            setInterval(() => {
                // 可以修改成自己想送的資料
                let data: any = {
                    x: 0,
                    y: 1,
                    eventDate: dateformat(new Date(), "isoUtcDateTime")
                };

                // 將資料轉換成 JSON 格式後封裝成 iothub 的 message 格式
                let message = new iotDevice.Message(JSON.stringify(data));
                
                console.log(`Sending message ${message.getData()}...`);
                deviceClient.sendEvent(message, (err, res) => {
                    if (err) console.error(`[Device-${i}] Error: ${err.toString()}`);
                    if (res) console.log(`[Device-${i}] Status: ${res.constructor.name}`);
                });
            }, 1000);
        }
    });