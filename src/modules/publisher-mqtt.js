/*
 Tanand Data Publisher for MQTT - created based on publisher standard publisher interface
*/
const mqtt = require('mqtt');
const _ = require('lodash');

const { info } = require('tanand-logger')('PUB-MQTT');

let client;
const publisher = {
  connected: false,
};

publisher.initialize = () => {
  info('Initializing');
  const host = publisher.config.host || 'localhost';
  client = mqtt.connect(`mqtt://${host}`);

  client.on('connect', () => {
    info(`Publish channel MQTTT connected: ${host}`);
    publisher.connected = true;
  });
};

publisher.publish = (topic, payload) => {
  if (publisher.connected) {
    // convert to string if the payload is an object
    const payloadStr = _.isObject(payload) ? JSON.stringify(payload) : payload;

    client.publish(topic, payloadStr);
    return true;
  }
  return false;
};

module.exports = (config) => {
  if (!config) { throw new Error('Missing configuration definition'); }

  publisher.config = config;

  return publisher;
};
