const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');
const TwitterClient = require('./twitterUtils/TwitterAPIClient.js');


produceKafkaMessage = () => {
  let producer = new Producer(process.env.KAFKA_SERVER);
  let kafkaMsg = {
    topic: "example",
    messages: "Sample kafka message"
  };

  let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  producer.publish(formattedKafkaMsg);
}

(main = () => {
  // fire up kafka producer and consumer

  // light up twitter api
  let tc = new TwitterClient();
  tc.setBearerToken();

})();
