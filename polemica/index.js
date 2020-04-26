const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');
const TwitterClient = require('./twitterUtils/TwitterAPIClient.js');

const initUserInput = () => {
  let standard_input = process.stdin;
  standard_input.setEncoding('utf-8');

  console.log("Please input text in command line.");
  return standard_input;
}

const publishInputToKafka = (data, producer) => {
  if (data === 'exit\n') {
      console.log("User input complete, program exit.");
      process.exit();
  }

  let obj = { userInput: data};

  let kafkaMsg = {
    topic: "example",
    messages: JSON.stringify(obj)
  };

  let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  producer.publish(formattedKafkaMsg);
}

const testSetup = (producer) => {
  let userInput = initUserInput();
  userInput.on('data', (data, producer) => {
    publishInputToKafka(data, producer);
  });
}

(async () => {
  // fire up kafka producer and consumer
  let producer = new Producer(process.env.KAFKA_SERVER);
  let consumer = new Consumer(process.env.KAFKA_SERVER);

  // light up twitter api
  let stream;
  let tc = new TwitterClient();
  tc.init().then(() => {
      tc.listenToStream();
      tc.stream.on('data', (data) => {
        let out = tc.handleData(data);
        let kafkaMsg = {
          topic: "twitterPOC",
          messages: JSON.stringify(out)
        }

        let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
        producer.publish(formattedKafkaMsg);
      })
      .on('error', error => {
        if (error.code === 'ESOCKETTIMEDOUT') {
          stream.emit('timeout');
        }
      })
      .on('timeout', async () => {
        tc.handleTimeout();
      });
  });
})();
