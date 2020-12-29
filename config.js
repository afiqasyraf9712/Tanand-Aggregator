const config = {};

// Global configuration

config.web = {
  port: 3000,
};

config.publisher = {
  type: 'mqtt',
  module: 'modules/publisher-mqtt',
  config: {
    host: '127.0.0.1',
  },
};

config.subscriber = {
  type: 'mqtt',
  module: 'modules/subscriber-mqtt',
  config: {
    host: '127.0.0.1',
  },
};

config.cloudSync = {
  batchSize: 7200, // 2 hour
  querySize: 100,
  syncFrequency: 10, // every 5 minute in seconds
};

config.server = {
  syncFrequency: 180,
};

module.exports = config;
