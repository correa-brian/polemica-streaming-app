const Producer = require('./kafkaUtils/Producer.js');
const Consumer = require('./kafkaUtils/Consumer.js');
const TwitterClient = require('./twitterUtils/TwitterAPIClient.js');

const initUserInput = () => {
  let standard_input = process.stdin;
  standard_input.setEncoding('utf-8');

  console.log("Please input text in command line.");
  return standard_input;
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
        // do something with the twitter payload
        // TODO: place twitter messages onto kafka
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

  // @HereForTesting
  // let userInput = initUserInput();
  // userInput.on('data', (data) => {
  //   if (data === 'exit\n') {
  //       console.log("User input complete, program exit.");
  //       process.exit();
  //   }
  //
  //   let obj = { userInput: data};
  //
  //   let kafkaMsg = {
  //     topic: "example",
  //     messages: JSON.stringify(obj)
  //   };
  //
  //   let formattedKafkaMsg = producer.buildMessage(kafkaMsg);
  //   producer.publish(formattedKafkaMsg);
  // });
})();
