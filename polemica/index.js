const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');
const TwitterClient = require('./twitterUtils/TwitterAPIClient.js');

const initUserInput = () => {
  let standard_input = process.stdin;
  standard_input.setEncoding('utf-8');

  console.log("Please input text in command line.");
  return standard_input;
}


(main = () => {
  // fire up kafka producer and consumer
  let producer = new Producer(process.env.KAFKA_SERVER);
  let consumer = new Consumer(process.env.KAFKA_SERVER);

  // light up twitter api
  let tc = new TwitterClient();
  tc.setBearerToken();

  let userInput = initUserInput();
  userInput.on('data', (data) => {
    if (data === 'exit\n') {
        console.log("User input complete, program exit.");
        process.exit();
    }

    let kafkaMsg = {
      topic: "example",
      messages: data
    };

    let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
    producer.publish(formattedKafkaMsg);
  });
})();
