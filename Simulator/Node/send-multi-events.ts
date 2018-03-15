import * as iothub from 'azure-iothub';
import * as iotDeviceMqtt from 'azure-iot-device-mqtt';
import * as iotDevice from 'azure-iot-device';
import * as dateformat from 'dateformat';

import { config } from './config';
import * as util from './util';
import { randomBytes } from 'crypto';

util.initDevicesAsync()
    .then((devices: Array<iothub.Device>) => {
        for (let i = 0; i < devices.length; ++i) {
            let deviceConnectionString: string = `HostName=${config.iothub.host};DeviceId=${devices[i].deviceId};SharedAccessKey=${devices[i].authentication.symmetricKey.primaryKey}`;
            let deviceClient: iotDevice.Client = iotDeviceMqtt.clientFromConnectionString(deviceConnectionString);

            // 每一秒送一次溫度溼度資料
            setInterval(() => {
                let temperature = 18 + Math.floor(Math.random() * 22),  /* 18 ~ 40 */
                    humidity = 40 + Math.floor(Math.random() * 50); /* 40 ~ 90 */

                let data: any = {
                    'temperature': temperature,
                    'humidity': humidity,
                    'deviceId': devices[i].deviceId,
                    'eventDate': dateformat(new Date(), "isoUtcDateTime")
                };

                // 將資料轉換成 JSON 格式後封裝成 iothub 的 message 格式
                let message = new iotDevice.Message(JSON.stringify(data));

                message.properties.add('messageType', 'TEMP');
                
                console.log(`Sending message ${message.getData()}...`);
                deviceClient.sendEvent(message, (err, res) => {
                    if (err) console.error(`[Device-${i}] Error: ${err.toString()}`);
                    if (res) console.log(`[Device-${i}] Status: ${res.constructor.name}`);
                });
            }, 1000);

            // 每兩秒送一次空氣資料
            setInterval(() => {
                let air = Math.floor(Math.random() * 30); /* 0 ~ 9: bad, 10 ~ 19: normal, 20 ~ 29: good */

                let data: any = {
                    'air': air,
                    'deviceId': devices[i].deviceId,
                    'eventDate': dateformat(new Date(), "isoUtcDateTime")
                };

                // 將資料轉換成 JSON 格式後封裝成 iothub 的 message 格式
                let message = new iotDevice.Message(JSON.stringify(data));

                message.properties.add('messageType', 'AIR');

                console.log(`Sending message ${message.getData()}...`);
                deviceClient.sendEvent(message, (err, res) => {
                    if (err) console.error(`[Device-${i}] Error: ${err.toString()}`);
                    if (res) console.log(`[Device-${i}] Status: ${res.constructor.name}`);
                });
            }, 3000);
        }
    });