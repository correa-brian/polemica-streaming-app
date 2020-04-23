const kafka = require('kafka-node');
const bp = require('body-parser');

const KAFKA_TOPIC = "example";
const KAFKA_SERVER = "localhost:2181";

function init() {
  console.log("init Consumer");
  console.log("---------------");
  try {
    const client = new kafka.KafkaClient(KAFKA_SERVER);
    let consumer = new kafka.Consumer(
      client,
      [{ topic: KAFKA_TOPIC, partition: 0 }],
      {
        autoCommit: true,
        fetchMaxWaitMs: 1000,
        fetchMaxBytes: 1024 * 1024,
        encoding: 'utf8',
        fromOffset: false
      }
    );

    consumer.on('message', async function(message) {
      console.log('here');
      console.log(
        'kafka message -> ',
        message.value
      );
    });

    consumer.on('error', function(err) {
      console.log('error', err);
    });
  } catch(e) {
    console.log(e);
  }
}
