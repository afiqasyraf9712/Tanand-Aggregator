/*
 Tanand Data PUBSUB for MQTT - created based on standard PUBSUB interface
*/
const Config = require('config');
const mqtt = require('mqtt');
const match = require('mqtt-match');
const _ = require('lodash');
const { info } = require('tanand-logger')('PUBSUB-MQTT');

const config = Config.get('pubsub');

if (!config) {
  throw new Error('Missing configuration definition');
}

let client;
const pubsub = {
  connected: false,
};

const listeners = [];

pubsub.initialize = () => {
  info('Initializing');
  const { host = 'localhost', port = 1883 } = config;
  info('Initializing', host, port);
  const options = { host, port };
  if (config.will) {
    let willTopic = config.will.topic;
    if (config.topicPrefix) {
      willTopic = config.topicPrefix + willTopic;
    }
    options.will = {
      topic: willTopic,
      payload: Buffer.from(JSON.stringify(config.will.payload)),
    };
  }

  client = mqtt.connect(options);

  client.on('connect', () => {
    info(`Pubsub channel connected: ${host}:${port}`);
    pubsub.connected = true;

    if (config.birth) {
      pubsub.publish(config.birth.topic, config.birth.payload);
    }
  });

  client.on('close', () => {
    info('Pubsub channel disconnected');
    pubsub.connected = false;
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

pubsub.publish = (topic, payload) => {
  if (config.topicPrefix) {
    topic = config.topicPrefix + topic;
  }
  return pubsub.publishRaw(topic, payload);
};

pubsub.publishRaw = (topic, payload) => {
  if (pubsub.connected) {
    // convert to string if the payload is an object
    const payloadStr = _.isObject(payload) ? JSON.stringify(payload) : payload;

    client.publish(topic, payloadStr);
    return true;
  }
  return false;
};

pubsub.subscribe = (listener, topicPattern) => {
  if (config.topicPrefix) {
    topicPattern = config.topicPrefix + topicPattern;
  }

  if (!listeners[topicPattern]) {
    listeners[topicPattern] = [];
  }

  listeners[topicPattern].push(listener);
  if (client) {
    client.subscribe(topicPattern);
  }
};

module.exports = pubsub;
