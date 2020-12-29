const config = {};

config.web = {
  port: 3004,
};
config.maxDemand = {
  maxDemandCalc: true,
  devices: [
    {
      plantId: "plant1",
      deviceId: [
        "LV-F1",
        "LV-F2A",
        "LV-F3A",
        "LV-F3B1",
        "LV-F3B2",
        "LV-F5B",
        "LV-F6A",
        "LV-F6B",
      ],
    },
    {
      plantId: "plant2",
      deviceId: ["LV-F7A", "LV-F7B", "LV-F8A", "LV-F8B"],
    },
  ],
  // scanInterval: '*/1 * * * *', //* /5 8-22 * * *
  scanInterval: "*/30 * * * *",
};

config.shinetsuEnergyUsage = {
  //run every 5 minutes
  energyUsageCalc: true,
};

config.areaList = [
  // Factory1
  "F1B-4-4-2",
  "F1B-4-4-3",
  "F1B-4-4-4",
  "F1B-4-4-5",
  "F1B-4-4-6",
  "F1B-4-4-7",
  "F1B-4-4-8",
  "F1B-4-4-9",
  "F1B-5-5-2",
  "F1B-5-5-3",
  "F1B-5-5-4",
  "F1B-5-5-5",
  "F1B-5-5-6",
  "F1B-5-5-7",
  "F1B-5-5-8",
  "F1B-5-5-9",
  // Factory2B
  "F2B-2",
  "F2B-11",
  "F2B-12",
  "F2B-16",
  "F2B-31",
  // Factory3B1
  "F3B1-2",
  "F3B1-3",
  "F3B1-8",
  // Factory3B2
  "F3B2-1",
  "F3B2-2",
  "F3B2-8",
  // Factory5
  "F5B-2",
  "F5B-9",
  "F5B-11",
  "F5B-14",
  // Factory6B
  "F6B-2",
  // Factory7B
  "F7B-2",
  "F7B-3",
  "F7B-5",
  "F7B-22-1",
  // Factory8B
  "F8B-8",
  "F8B-9",
  "F8B-10",
  "F8B-11",
  "F8B-12",
  "F8B-14",
  "F8B-15",
  "F8B-17",
  "F8B-24-10-1",
  "F8B-24-10-2",
  "F8B-24-10-3",
  "F8B-24-10-4",
  "F8B-24-10-5",
  "F8B-24-10-6",
  "F8B-24-10-7",
  "F8B-24-11-1",
  "F8B-24-11-2",
  "F8B-24-11-3",
  "F8B-24-11-4",
  "F8B-24-11-5",
  "F8B-24-11-6",
  "F8B-24-11-7",
  "F8B-24-11-8",
  "F8B-24-11-9",
];

// config.pubsub = {
//   type: 'mqtt',
//   module: 'modules/pubsub-mqtt',
//   topicPrefix: 'shinetsu/',
//   host: '127.0.0.1',
//   port: 1883,
// };

// config.influx = {
//   host: 'localhost',
//   port: '8086',
//   database: 'shinetsu',
//   publishInterval: '*/4 * * * *',
// };

config.pubsub = {
  type: "mqtt",
  module: "modules/pubsub-mqtt",
  topicPrefix: "office/",
  host: "127.0.0.1",
  port: 1883,
};

config.influx = {
  host: "localhost",
  port: "8086",
  token:
    "E_8gWdKxMJOrX93xbPNFaZg7nG3eb2AI_wZZJ-wqxf_ZOmAbUaBDoFH2CAh2mQlwB7LlppmU6f7y4E-TiCxyvw==",
  org: "Tanand Tech",
  bucket: "Office",
  publishInterval: "*/1 * * * *",
};

config.officeEnergyUsage = {
  //run every 5 minutes
  energyUsageCalc: true,
};
module.exports = config;
