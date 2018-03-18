import * as fs from 'fs';

import * as iothub from 'azure-iothub';
import * as iotDeviceMqtt from 'azure-iot-device-mqtt';
import * as iotDevice from 'azure-iot-device';

import { config } from './config';
import * as util from './util';
import { FILE } from 'dns';

const FILE_PATH = '../assets/Azure IoTHub_COLOR.png';

// Use service client to receive the file upload notifications
let serviceClient = iothub.Client.fromConnectionString(`HostName=${config.iothub.host};SharedAccessKeyName=${config.iothub.policy};SharedAccessKey=${config.iothub.accessKey}`);
serviceClient.open((err) => {
    if (err) {
        console.error("Cannot connect to IoT Hub: " + err.message);
    } else {
        console.log("Service client has connected to the IoT Hub.");
        serviceClient.getFileNotificationReceiver((err?: Error, receiver?: iothub.Client.ServiceReceiver) => {
            if (err) {
                console.error("Cannot get the file upload notification: " + err.toString());
            } else {
                receiver.on('message', (msg: iotDevice.Message): void => {
                    console.log('File upload from device:')
                    console.log(msg.getData().toString());
                });
            }
        })
    }
});

util.initDevicesAsync()
    .then((devices: Array<iothub.Device>) => {
        // Use SimulationDevice-0 for uploading the file.
        let device = devices[0];
        let deviceConnectionString: string = `HostName=${config.iothub.host};DeviceId=${device.deviceId};SharedAccessKey=${device.authentication.symmetricKey.primaryKey}`;
        let deviceClient: iotDevice.Client = iotDeviceMqtt.clientFromConnectionString(deviceConnectionString);

        console.log("Opening the file: " + FILE_PATH);
        fs.stat(FILE_PATH, (err, stats) => {
            const rs = fs.createReadStream(FILE_PATH);

            console.log("Uploading the file...");
            deviceClient.uploadToBlob(`IoTHub-${new Date().getTime()}.png`, rs, stats.size, (err) => {
                if (err) {
                    console.error("Error uploading file: " + err.toString());
                } else {
                    console.log("File has benn uploaded.");
                }
            });
        });
    });

