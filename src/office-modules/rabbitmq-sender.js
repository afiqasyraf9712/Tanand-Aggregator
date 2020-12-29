const amqp = require("amqplib/callback_api");

const send = (queryResult) => {
  // every 4 minutes we connect
  amqp.connect("amqp://localhost", function (error0, connection) {
    if (error0) {
      throw error0;
    }
    connection.createChannel(function (error1, channel) {
      if (error1) {
        throw error1;
      }
      let exchange = "logs";
      let msg = queryResult;

      channel.assertExchange(exchange, "fanout", {
        durable: false,
      });

      channel.publish(exchange, "", Buffer.from(msg));
      console.log(`Sent ${msg}`);
    });
  });
};

module.exports = { send };
