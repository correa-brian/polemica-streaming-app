const kafka = require('kafka-node');
const bp = require('body-parser');

const consumerConfig = {
  autoCommit: true,
  fetchMaxWaitMs: 1000,
  fetchMaxBytes: 1024 * 1024,
  encoding: 'utf8',
  fromOffset: false
};

/**
 * Represents the Kafka Consumer.
 */
class Consumer {
  constructor(kafkaServer) {
    this.client = new kafka.KafkaClient(kafkaServer);
    this.consumer = new kafka.Consumer(
      this.client,
      [{ topic: "example", partition: 0 }],
      consumerConfig
    );

    this.connect();
  }

  /**
   * Checks the message event of the Kafka connection.
   *
   * @return {void}
   */
  connect() {
    try {
      this.consumer.on('message', async (message) => {
        console.log(
          'kafka message -> ',
          message.value
        );
      });

      this.consumer.on('error', (err) => {
        throw err;
      });
    } catch(e) {
      console.log("Exception: ", e);
    }
  }
}

module.exports = Consumer;
