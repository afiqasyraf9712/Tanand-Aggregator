/* eslint-disable no-sequences */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
/* eslint-disable import/no-dynamic-require */
require("dotenv").config();

const Config = require("config");
const cron = require("node-cron");
const { info, error } = require("tanand-logger")("APP");
const express = require("express");
const fs = require("fs");
const { officeEnergyUsage } = Config;

const pubsubConfig = Config.get("pubsub");
if (!pubsubConfig) {
  throw new Error("Pubsub config is specified");
}

const pubsub = require(`./${pubsubConfig.module}`);
const officeEnergyCalc = require("./office-modules/officeEnergyUsage")(pubsub);

const Util = require("../src/util");

const { publishInterval } = Config.influx;
const { nodeEnv } = Util.env;

const initialize = () => {
  if (nodeEnv !== 0 && nodeEnv !== 1) {
    error(
      "NODE_ENV environment var is not set. Please make sure you run using npm run start"
    );
    process.exit(1);
  }
  //cron interval
  if (officeEnergyUsage.energyUsageCalc) {
    info("Office Energy Usage Calculation Enabled");
    cron.schedule(publishInterval, async () => {
      officeEnergyCalc.dataSync();
    });
  } else {
    info("Office Energy Usage Calculation Disabled");
  }
};

initialize();
