const Producer = require('./kafkaUtils/Producer.js');

function init() {
  let producer = new Producer();
  let kafkaMsg = {
    "topic": "example",
    "messages": "Kafka Message text"
  };

  let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  producer.send(formattedKafkaMsg);
}

init();
