const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');

function produceKafkaMessage() {
  let producer = new Producer(process.env.KAFKA_SERVER);
  let kafkaMsg = {
    topic: "example",
    messages: "Sample kafka message"
  };

  let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  producer.send(formattedKafkaMsg);
}

function main() {
  produceKafkaMessage();
  let consumer =  new Consumer(process.env.KAFKA_SERVER);
}

main();
