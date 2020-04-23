const kafka = require('kafka-node');
const bp = require('body-parser');

const KAFKA_TOPIC = "example";
const KAFKA_SERVER = "localhost:2181";

class Producer {
  constructor() {
    this.client = new kafka.KafkaClient(KAFKA_SERVER);
    this.producer = new kafka.Producer(this.client);
    this.connect();
  }

  connect() {
    try {
      this.producer.on('ready', () => {
        console.log("ready");
      });

      this.producer.on('error', (err) => {
        this.handleError();
      });
    } catch(e) {
      console.log("Exception: ", e);
    }
  }

  buildMessage(payload) {
    return [
      { "topic": payload.topic, "messages": payload.messages }
    ];
  }

  async send(kafkaMessage) {
    let push_status = this.producer.send(kafkaMessage, (err, data) => {
       if (err) {
         console.log('kafka-producer -> ' + kafkaMessage[0].topic + '. Failed!');
         throw err;
       }

        console.log('kafka-producer -> ' + kafkaMessage[0].topic + '. Success!');
        return data;
     });
  }

  async handleError() {
    throw err;
  }
}

module.exports = Producer;
