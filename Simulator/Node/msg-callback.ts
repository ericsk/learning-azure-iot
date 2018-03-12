import * as iothub from 'azure-iothub';
import * as iotDeviceMqtt from 'azure-iot-device-mqtt';
import * as iotDevice from 'azure-iot-device';

import { config } from './config';
import * as util from './util';

util.initDevicesAsync()
    .then((devices: Array<iothub.Device>) => {
        for (let i = 0; i < devices.length; ++i) {
            let deviceConnectionString: string = `HostName=${config.iothub.host};DeviceId=${devices[i].deviceId};SharedAccessKey=${devices[i].authentication.symmetricKey.primaryKey}`;
            let deviceClient: iotDevice.Client = iotDeviceMqtt.clientFromConnectionString(deviceConnectionString);

            deviceClient.on('message', (msg: iotDevice.Message) => {
                console.log("Receiving message from cloud: ", msg);
                console.log("Data: ", msg.getData().toString());
                console.log("Properties:")
                for (let i = 0; i < msg.properties.count(); ++i) {
                    let p: any = msg.properties.getItem(i);
                    console.log(`Property: ${p.key} => ${p.value}`)
                }
            });

            console.log(`Device '${devices[i].deviceId}' is listening from cloud...`);
        }
    });