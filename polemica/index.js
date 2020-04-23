const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');

async function produceKafkaMessage() {
  let producer = new Producer(process.env.KAFKA_SERVER);
  let kafkaMsg = {
    topic: "example",
    messages: "Sample kafka message"
  };

  let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  return producer.send(formattedKafkaMsg);
}

function consumeKafkaMessage() {
  let consumer =  new Consumer(process.env.KAFKA_SERVER);
}

async function main() {
  produceKafkaMessage();
  consumeKafkaMessage();
}

main();
