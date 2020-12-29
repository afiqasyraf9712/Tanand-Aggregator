const Config = require("config");
const fs = require("fs");
const { info, error } = require("tanand-logger")("Office");
const _ = require("lodash");
const influxSvc = require("./influxService");

const syncBuffer = 900;

module.exports = () => {
  const module = {};

  module.energyUsage = (queryData) => {
    const map = [];
    queryData.forEach((data) => {
      const payload = {
        deviceId: data._measurement,
        energyUsage: data._value,
        timestamp: data._time,
      };
      map.push(payload);
    });
    // console.log(map);
    return map;
  };

  module.dataSync = () => {
    const round = 300;
    timeNow = Math.ceil(Date.now() / 1000);
    timeNow = Math.floor(timeNow / round) * round;
    time = parseInt(timeNow, 10) - syncBuffer;
    try {
      influxSvc.getPower(time);
    } catch (err) {
      error("Error", err.message);
    }
  };

  return module;
};
