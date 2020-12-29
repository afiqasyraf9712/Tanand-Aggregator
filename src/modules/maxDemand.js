/* eslint-disable no-restricted-syntax */
/* eslint-disable no-unused-vars */
const { error } = require('tanand-logger')('APP');
const _ = require('lodash');
const moment = require('moment');
const influxSvc = require('./InfluxService');
const Util = require('../util');

const isTesting = Util.env.nodeEnv;

module.exports = (pubsub) => {
  const module = {};

  const publishMaxDemandData = (plantId, data) => {
    data.forEach((element) => {
      // eslint-disable-next-line no-param-reassign
      element.deviceId = plantId;
      pubsub.publish(`data/${element.deviceId}/power`, element);
    });
  };

  const maxDemand = (data, deviceId, timestamp) => {
    const map = [];
    Object.keys(data)
      .filter(key => data[key].time)
      .forEach((key) => {
        // let timestamp = '';
        // timestamp = Math.round(data[key].time.getNanoTime() / 1000000);
        const demand = data[key].sum * 2; // times 2 to get one hour data
        const payload = {
          deviceId,
          maxDemand: demand,
          timestamp,
        };

        map.push(payload);
      });

    return map;
  };

  module.maxDemandCalculation = (maxDemandObj) => {
    // insert data to influx test
    const now = moment();
    const remainder = now.minute() % 30;
    const startTime = moment(now).subtract(remainder, 'minutes').unix();
    const endTime = moment.unix(startTime).add(30, 'minutes').unix();

    // const tempStartTime = 1599120000;
    // const endTime = 1599123600;

    maxDemandObj.forEach((device) => {
      const { plantId, deviceId } = device;

      let query = '';
      // construct influx query
      deviceId.forEach((value, index) => {
        if (index + 1 === deviceId.length) {
          query += (`device_id = '${value}'`);
        } else {
          query += (`device_id = '${value}' OR `);
        }
      });

      influxSvc.getMaxDemandData(query, startTime, endTime)
        .then((data) => {
          const result = maxDemand(data, deviceId, startTime * 1000);
          publishMaxDemandData(plantId, result);
        })
        .catch((err) => {
          error('Error', err.message);
        });
    });
  };

  module.maxDemandTest = (data, deviceId) => maxDemand(data, deviceId);

  return module;
};
