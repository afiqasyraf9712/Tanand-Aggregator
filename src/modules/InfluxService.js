const Config = require("config");
const Influx = require("influx");

const { host = "localhost", port = 8086, database } = Config.get("influx");

if (!database) {
  throw new Error("Influx database is not specified");
}

const influx = new Influx.InfluxDB({
  host,
  database,
  port,
  schema: [
    // schema here
  ],
});
// dia sum kan all the data every 5 minutes using the group by function, then use difference lps tu
influx.getPower = (time1, time2) => {
  const query = `SELECT difference(sum(energy)) as total_usage FROM power WHERE time >= ${time1}s 
  and time <= ${time2}s group by time(5m),device_id fill(none)`;

  return influx.query(query);
};

influx.getMaxDemandData = (deviceQuery, time1, time2) => {
  const query = `SELECT sum(energyUsage) FROM power WHERE time >= ${time1}s AND time <= ${time2}s AND (${deviceQuery})`;

  return influx.query(query);
};

module.exports = influx;
