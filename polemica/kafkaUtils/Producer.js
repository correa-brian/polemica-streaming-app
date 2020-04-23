const kafka = require('kafka-node');
const bp = require('body-parser');

/**
 * Represents a Kafka Producer.
 */
class Producer {
  constructor(kafkaServer) {
    this.client = new kafka.KafkaClient(kafkaServer);
    this.producer = new kafka.Producer(this.client);
    this.connect();
  }

  /**
   * Checks the ready event of the Kafka connection.
   *
   * @return {void}
   */
  connect() {
    try {
      this.producer.on('ready', async () => {
        console.log("producer connection ready");
      });

      this.producer.on('error', (err) => {
        throw err;
      });
    } catch(e) {
      console.log("Exception: ", e);
    }
  }

  /**
   * Accepts a hashmap and formats it into an Array of Kafka messages.
   *
   * @param {Object.<string, string>}
   * @return {Array}
   */
  buildMessage(payload) {
    return [
      { topic: payload.topic, messages: payload.messages },
      { topic: payload.topic, messages: "Msg 1" },
      { topic: payload.topic, messages: "Msg 2" },
      { topic: payload.topic, messages: "Msg 3" },
      { topic: payload.topic, messages: "Msg 4" }
    ];
  }

  /**
   * Emits an array of Kafka messages to their respective topics.
   *
   * @return {string, int}
   */
  publish(kafkaMessage) {
    let push_status = this.producer.send(kafkaMessage, async (err, data) => {
       if (err) {
         console.log('kafka-producer -> ' + kafkaMessage[0].topic + '. Failed!');
         throw err;
       }

        return data;
     });
  }
}

module.exports = Producer;
