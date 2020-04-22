const URL = require('url').URL;
const https = require('https');
const request = require('request');
const util = require('util');
const kafka = require('kafka-node');
const bp = require('body-parser');

const KAFKA_TOPIC = "example";
const KAFKA_SERVER = "localhost:2181";

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const consumer_key = ''; // Add your API key here
const consumer_secret = ''; // Add your API secret key here

const bearerTokenURL = new URL('https://api.twitter.com/oauth2/token');
const streamURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter');
const rulesURL = new URL('https://api.twitter.com/labs/1/tweets/stream/filter/rules');
//
// async function sleep(delay) {
//   return new Promise((resolve) =>
//     setTimeout(() =>
//       resolve(true), delay));
// }

async function bearerToken (auth) {
  const requestConfig = {
    url: bearerTokenURL,
    auth: {
      user: consumer_key,
      pass: consumer_secret,
    },
    form: {
      grant_type: 'client_credentials',
    },
  };

  const response = await post(requestConfig);
  const body = JSON.parse(response.body);

  if (response.statusCode !== 200) {
    const error = body.errors.pop();
    throw Error(`Error ${error.code}: ${error.message}`);
    return null;
  }

  return JSON.parse(response.body).access_token;
}

async function getAllRules(token) {
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    }
  };

  const response = await get(requestConfig);
  if (response.statusCode !== 200) {
    throw new Error(response.body);
    return null;
  }

  return JSON.parse(response.body);
}

async function deleteAllRules(rules, token) {
  if (!Array.isArray(rules.data)) {
    return null;
  }

  const ids = rules.data.map(rule => rule.id);

  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      delete: {
        ids: ids
      }
    }
  };

  const response = await post(requestConfig);
  if (response.statusCode !== 200) {
    throw new Error(JSON.stringify(response.body));
    return null;
  }

  return response.body;
}

async function setRules(rules, token) {
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: {
      add: rules
    }
  };

  const response = await post(requestConfig);
  if (response.statusCode !== 201) {
    throw new Error(JSON.stringify(response.body));
    return null;
  }

  return response.body;
}

function streamConnect(token) {
  // Listen to the stream
  const config = {
    url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed&tweet.format=detailed',
    auth: {
      bearer: token,
    },
    timeout: 20000,
  };

  const stream = request.get(config);

  stream.on('data', data => {
      try {
        const json = JSON.parse(data);
        console.log(json);
        if (json.connection_issue) {
          stream.emit('timeout');
        }
      } catch (e) {
        // Heartbeat received. Do nothing.
      }

  }).on('error', error => {
    if (error.code === 'ESOCKETTIMEDOUT') {
      stream.emit('timeout');
    }
  });

  return stream;
}

(async () => {
  console.log("init Producer");
  console.log("---------------");
  try {
    const client = new kafka.KafkaClient(KAFKA_SERVER);
    const producer = new kafka.Producer(client);

    const kt = "example";

    let payloads = [
      {
        topic: kt,
        messages: KAFKA_TOPIC + " plus my stuff here"
      }
    ];

    producer.on('ready', async function() {
      let push_status = producer.send(payloads, (err, data) => {
         if (err) {
           console.log('[kafka-producer -> '+KAFKA_TOPIC+']: broker update failed');
         } else {
           console.log('[kafka-producer -> '+KAFKA_TOPIC+']: broker update success');
         }
      });
    });

    producer.on('error', function(err) {
      console.log(err);
      console.log('[kafka-producer -> '+KAFKA_TOPIC+']: connection errored');
      throw err;
  });
  } catch(e) {
    console.log("Exception: ", e);
  }

  let token = process.env.TOKEN;
  let currentRules, stream;
  let timeout = 0;
  //
  // const rules = [
  //   { 'value': 'dog has:images', 'tag': 'dog pictures' },
  //   { 'value': 'cat has:images -grumpy', 'tag': 'cat pictures' },
  // ];
  //
  // try {
  //   // Exchange your credentials for a Bearer token
  //   token = await bearerToken({consumer_key, consumer_secret});
  // } catch (e) {
  //   console.error(`Could not generate a Bearer token. Please check that your credentials are correct and that the Filtered Stream preview is enabled in your Labs dashboard. (${e})`);
  //   process.exit(-1);
  // }
  //
  try {
    // Gets the complete list of rules currently applied to the stream
    // currentRules = await getAllRules(token);
    // console.log("current " , currentRules);

    // // Delete all rules. Comment this line if you want to keep your existing rules.
    // await deleteAllRules(currentRules, token);

    // // Add rules to the stream. Comment this line if you want to keep your existing rules.
    // await setRules(rules, token);
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }

  // Listen to the stream.
  // This reconnection logic will attempt to reconnect when a disconnection is detected.
  // To avoid rate limites, this logic implements exponential backoff, so the wait time
  // will increase if the client cannot reconnect to the stream.
  const connect = () => {
    try {
      stream = streamConnect(token);
      stream.on('timeout', async () => {
        // Reconnect on error
        console.warn('A connection error occurred. Reconnecting…');
        timeout++;
        stream.abort();
        await sleep((2 ** timeout) * 1000);
        connect();
      });
    } catch (e) {
      connect();
    }
  }

  // connect();
})();

(function runTest() {
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
  })
  consumer.on('error', function(err) {
    console.log('error', err);
  });
} catch(e) {
  console.log(e);
  }
})();
