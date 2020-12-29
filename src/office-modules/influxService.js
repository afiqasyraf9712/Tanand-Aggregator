const Config = require("config");
const influx = require("@influxdata/influxdb-client");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const { host, port, token, org, bucket } = Config.get("influx");
const rabbitmqsender = require("./rabbitmq-sender");

const pubsubConfig = Config.get("pubsub");

if (!pubsubConfig) {
  throw new Error("Pubsub config is specified");
}

const pubsub = require(`../${pubsubConfig.module}`);
// const officeEnergyCalc = require("./officeEnergyUsage")(pubsub);

const client = new InfluxDB({
  url: `http://${host}:${port}`,
  token: token,
});

// change measurement to energy - add tag as the devices - field will be the value
const getPower = (time) => {
  console.log("###    QUERY ROWS   ###");
  const queryApi = client.getQueryApi(org);

  const fluxQuery = `from(bucket:"Office")
                      |> range(start: -${time}m)
                      |> filter(fn: (r) =>
                          r._measurement == "power")
                      |> sum()`;

  let queryResults;
  return queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      // console.log(o);
      queryResults = o;
      // var date = new Date(Date.parse(o._time));
      // console.log(`${date.getHours()}:${date.getMinutes()}`);
      // console.log(
      //   // `${o._time} ${o._measurement} in '${o.location}' (${o._field} ${o._value})`
      //   `${o._time} ${o._measurement} - (${o._field} ${o._value}) ${Date.parse(
      //     o._time
      //   )}`
      // );
    },
    error(error) {
      console.error(error);
      console.log("\nQuery ERROR");
    },
    complete() {
      console.log("\nQuery SUCCESS");
      console.log("1", queryResults);

      //push to rabbitmq
      rabbitmqsender.send(queryResults);
      // return queryResults;
    },
  });
};

module.exports = { getPower };
