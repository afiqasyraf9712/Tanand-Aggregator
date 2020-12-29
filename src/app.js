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

const app = express();

const pubsubConfig = Config.get("pubsub");
// const { maxDemand, shinetsuEnergyUsage, areaList } = Config;

if (!pubsubConfig) {
  throw new Error("Pubsub config is specified");
}

const pubsub = require(`./${pubsubConfig.module}`);
// const demandCalc = require("./modules/maxDemand")(pubsub);
// const shinetsuEnergyCalc = require("./modules/shinetsuEnergyUsage")(pubsub);
const officeEnergy = require("./office-modules/officeEnergyUsage")(pubsub);

const Util = require("../src/util");

const { publishInterval } = Config.influx;
const { nodeEnv } = Util.env;

const jsonReader = (filePath, cb) => {
  fs.readFile(filePath, (err, fileData) => {
    if (err) {
      return cb && cb(err);
    }
    try {
      const object = JSON.parse(fileData);
      return cb && cb(null, object);
    } catch (errors) {
      return cb && cb(errors);
    }
  });
};

const initialize = () => {
  if (nodeEnv !== 0 && nodeEnv !== 1) {
    error(
      "NODE_ENV environment var is not set. Please make sure you run using npm run start"
    );
    process.exit(1);
  }

  pubsub.initialize();

  const port = Config.get("web.port") || 3008;

  app.use(express.json());

  app.listen(port, () => {
    info(`Data Aggregator listening on port: ${port}`);
  });

  app.get("/healthCheck", (req, res) => {
    res.send({ result: "OK" });
  });

  app.get("/getArea", (req, res) => {
    const obj = JSON.parse(fs.readFileSync("./properties.json"));
    obj.factories.forEach((factory) => {
      factory.devices.forEach((device) => {
        if (!areaList.includes(device.deviceId)) {
          const removeIndex = factory.devices
            .map((item) => item.deviceId)
            .indexOf(device.deviceId);
          delete factory.devices[removeIndex];
        } else {
          device.products.forEach((product) => {
            if (
              !product.name.includes("HVAC") &&
              !product.name.includes("COM")
            ) {
              const removeIndex = device.products
                .map((item) => item.name)
                .indexOf(product.name);
              delete device.products[removeIndex];
            }
          });
          device.products = device.products.filter((val) => val);
        }
      });
      factory.devices = factory.devices.filter((val) => val);
    });

    obj.factories.forEach((element) => {
      if (element.devices.length === 0) {
        const removeIndex = obj.factories
          .map((item) => item.factoryID)
          .indexOf(element.factoryID);
        delete obj.factories[removeIndex];
      }
    });

    obj.factories = obj.factories.filter((val) => val);

    res.send({ data: obj, result: "OK" });
  });

  app.post("/updateArea", (req, res) => {
    // add back neccessary keys to array
    req.body.factories.forEach((factory) => {
      factory.devices.forEach((device) => {
        device.products.forEach((item) => {
          device.products.push({
            name: item.name.split("-")[0],
            percentage: item.percentage,
          });
          device.products.push({
            name: `${device.deviceId}-${item.name.split("-")[0]}`,
            percentage: item.percentage,
          });
        });
      });
    });

    jsonReader("./properties.json", (err, properties) => {
      if (err) {
        res.send({ data: err, result: "NOK" });
      }

      req.body.factories.forEach((factory) => {
        properties.factories.forEach((fac) => {
          if (fac.factoryID === factory.factoryID) {
            const mapped = factory.devices.reduce(
              (a, t) => ((a[t.deviceId] = t), a),
              {}
            );
            const mapped2 = fac.devices.reduce(
              (a, t) => ((a[t.deviceId] = t), a),
              {}
            );

            const result = Object.values({ ...mapped2, ...mapped });
            fac.devices = result;
          }
        });
      });

      fs.writeFile(
        "./properties.json",
        JSON.stringify(properties, null, 2),
        (er) => {
          if (er) res.send({ data: er, result: "NOK" });
        }
      );

      res.send({ data: "OK", result: "OK" });
    });
  });

  if (shinetsuEnergyUsage.energyUsageCalc) {
    info("Shinetsu Energy Usage Calculation Enabled");
    cron.schedule(publishInterval, async () => {
      shinetsuEnergyCalc.dataSync();
    });
  } else {
    info("Shinetsu Energy Usage Calculation Disabled");
  }

  // schedule max demand calculation, to test insert data to local influx first
  if (maxDemand.maxDemandCalc) {
    info("Maximum Demand Calculation Enabled");
    cron.schedule(maxDemand.scanInterval, async () => {
      demandCalc.maxDemandCalculation(maxDemand.devices);
    });
  } else {
    info("Maximum Demand Calculation Disabled");
  }
};

initialize();
