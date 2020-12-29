const Config = require('config');
const fs = require('fs');
const {
  info,
  error,
} = require('tanand-logger')('SHINETSU');
const _ = require('lodash');
const influxSvc = require('./InfluxService');

const syncBuffer = 900;
let properties;
let time1;
let time2;

module.exports = (pubsub) => {
  const module = {};

  const initialMapping = () => {
    properties = JSON.parse(fs.readFileSync('./properties.json', 'utf8'));
  };

  const reorderDevices = (deviceObj) => {
    deviceObj.sort((a) => {
      if (a.deviceType === 'level-3') { return -1; }
      return 0;
    });

    deviceObj.sort((a) => {
      if (a.deviceType === 'level-2') { return -1; }
      return 0;
    });

    deviceObj.sort((a) => {
      if (a.deviceType === 'level-1') { return -1; }
      return 0;
    });

    return deviceObj.reverse();
  };

  const publishData = (data) => {
    data.forEach((element) => {
      pubsub.publish(`data/${element.deviceId}/power`, element);
    });
  };

  const publishOthersData = (data) => {
    data.forEach((element) => {
      pubsub.publish(`data/${element.deviceId}/power`, element);
    });
  };

  const publishProductsData = (data) => {
    data.forEach((element) => {
      pubsub.publish(`data/${element.productId}/product`, element);
    });
  };

  const publishOwn = (data) => {
    pubsub.publish('data/aggreagator', data);
  };

  const energyUsage = (data, dataSyncStartTime) => {
    const map = [];
    Object.keys(data).filter(key => data[key].time).forEach((key) => {
      const timeObject = data[key].time;
      let timestamp = '';

      timestamp = Math.round(timeObject.getNanoTime() / 1000000);

      // to remove first data that will be wrong due to calculate differences
      if (dataSyncStartTime > timestamp) {
        return;
      }

      if (data[key].total_usage < 0) {
        // eslint-disable-next-line no-param-reassign
        data[key].total_usage = 0;
      }

      const payload = {
        deviceId: data[key].device_id,
        energyUsage: data[key].total_usage,
        timestamp,
      };

      map.push(payload);
    });

    return map;
  };

  const productUsage = (payload) => {
    const payloadData = [];
    // to group payload by timestamp
    const data = _.groupBy(JSON.parse(payload), readings => readings.timestamp);

    // reach plant products usage calculation
    properties.factories.forEach((factory) => {
      const factoryMap = [];
      factory.devices.forEach((device) => {
        // info(`Found Device ${device.deviceId} in ${factory.factoryID}`);
        factoryMap.push(device);
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const [timestamp, readings] of Object.entries(data)) {
        const deviceObj = [];
        let productMap = [];
        const othersMap = [];
        readings.forEach((reading) => {
          const map = factoryMap.find(o => o.deviceId === reading.deviceId);
          if (map) {
            map.energyUsage = reading.energyUsage;
            map.timestamp = timestamp;
            deviceObj.push(map);
          }
        });

        // eslint-disable-next-line no-loop-func
        reorderDevices(deviceObj).forEach((element) => {
          element.products.forEach((product) => {
            if (product.percentage) {
              productMap.push({
                factoryId: factory.factoryID,
                productId: product.name,
                deviceId: element.deviceId,
                energyUsage: element.energyUsage * (product.percentage / 100),
                timestamp,
              });
            } else if (product.type) {
              // get current device readings
              if (element.deviceType === 'level-1') {
                let initialEnergyUsage = element.energyUsage;
                product.keys.forEach((keys) => {
                  productMap.forEach((p) => {
                    if (p.productId === keys) {
                      initialEnergyUsage -= p.energyUsage;
                    }
                  });
                });
				
				if (initialEnergyUsage < 0) {
                  initialEnergyUsage = 0;
                }
				
                productMap.push({
                  factoryId: factory.factoryID,
                  productId: product.name,
                  deviceId: `${factory.factoryID}-others`,
                  // deviceId: element.deviceId,
                  energyUsage: initialEnergyUsage,
                  timestamp,
                });

                othersMap.push({
                  deviceId: `${factory.factoryID}-others`,
                  energyUsage: initialEnergyUsage,
                  timestamp,
                });
              } else if (product.type === 'meter') {
                let initialEnergyUsage = element.energyUsage;
                product.keys.forEach((keys) => {
                  const pIndex = deviceObj.findIndex(obj => obj.deviceId === keys);
                  initialEnergyUsage -= deviceObj[pIndex].energyUsage;
                });
                productMap.push({
                  factoryId: factory.factoryID,
                  productId: product.name,
                  deviceId: element.deviceId,
                  energyUsage: initialEnergyUsage,
                  timestamp,
                });
              } else if (product.type === 'product') {
                let initialEnergyUsage = element.energyUsage;
                product.keys.forEach((keys) => {
                  const ppIndex = productMap.findIndex(obj => obj.productId === keys);
                  initialEnergyUsage -= productMap[ppIndex].energyUsage;
                  productMap.splice(ppIndex, 1);
                });
                productMap.push({
                  factoryId: factory.factoryID,
                  productId: product.name,
                  deviceId: element.deviceId,
                  energyUsage: initialEnergyUsage,
                  timestamp,
                });
              }
            }
          });
        });

        // eslint-disable-next-line no-loop-func
        productMap.forEach((device) => {
          if (device.productId.includes('HVAC') || device.productId.includes('COM')) {
            const productToRemove = device.productId.split('-')[0];
            productMap.forEach((device2, i) => {
              if (device2.productId === productToRemove && device2.deviceId === device.deviceId
                && device2.energyUsage === device.energyUsage) {
                delete productMap[i];
              }
            });
          }
        });

        productMap = productMap.filter(val => val);
        // console.log('final', productMap);
        // console.log('product to remove is ', productMap[1]);
        publishOthersData(othersMap);

        // filter out negative data
        productMap.forEach((element) => {
          if (element.energyUsage < 0) {
            // eslint-disable-next-line no-param-reassign
            element.energyUsage = 0;
          }
        });

        payloadData.push(productMap);
      }
    });

    return payloadData;
  };

  const productUsageHandler = (topic, payload) => {
    // info('incoming power meter data');

    const data = productUsage(payload);

    publishProductsData(data);
  };

  module.dataSync = async () => {
    initialMapping();
    pubsub.subscribe(productUsageHandler, 'data/aggreagator');
    const round = 300;
    time2 = Math.ceil(Date.now() / 1000);
    time2 = Math.floor(time2 / round) * round;
    time1 = parseInt(time2, 10) - syncBuffer; // sync data 15 minutes

    // console.log('Time 1 is  ', time1);
    // console.log('Time 2 is  ', time2);
    // time1 = 1599120000;
    // time2 = 1599123600;

    try {
      const data = await influxSvc.getPower(time1, time2);
      const result = energyUsage(data, time1);

      publishData(result);
      publishOwn(result);
    } catch (err) {
      error('Error', err.message);
    }
  };

  return module;
};
