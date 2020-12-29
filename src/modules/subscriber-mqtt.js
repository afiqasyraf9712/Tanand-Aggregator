/*
 Tanand Data Publisher for MQTT - created based on publisher standard publisher interface
*/
const mqtt = require('mqtt');
const match = require('mqtt-match');
const _ = require('lodash');

const { info } = require('tanand-logger')('SUB-MQTT');

let client;
const subscriber = {
  connected: false,
};

const listeners = [];

subscriber.initialize = () => {
  info('Initializing');
  const host = subscriber.config.host || 'localhost';
  client = mqtt.connect(`mqtt://${host}`);

  client.on('connect', () => {
    info(`Subscribe channel MQTT connected: ${host}`);
    subscriber.connected = true;
    Object.keys(listeners).forEach((pattern) => {
      client.subscribe(pattern);
    });
  });

  client.on('message', (topic, payload) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const topicPattern of Object.keys(listeners)) {
      // if topic matches pattern, send message to topic
      if (match(topicPattern, topic)) {
        listeners[topicPattern].forEach((handler) => {
          handler(topic, payload);
        });
      }
    }
  });
};

subscriber.subscribe = (listener, topicPattern) => {
  if (!listeners[topicPattern]) {
    listeners[topicPattern] = [];
  }

  listeners[topicPattern].push(listener);
  if (client) {
    client.subscribe(topicPattern);
  }
};

subscriber.publish = (topic, payload) => {
  if (subscriber.connected) {
    // convert to string if the payload is an object
    const payloadStr = _.isObject(payload) ? JSON.stringify(payload) : payload;

    client.publish(topic, payloadStr);
    return true;
  }
  return false;
};

module.exports = (config) => {
  if (!config) {
    throw new Error('Missing configuration definition');
  }

  subscriber.config = config;

  return subscriber;
};
