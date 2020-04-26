require('dotenv').config()
const URL = require('url').URL;
const https = require('https');
const request = require('request');
const util = require('util');

const get = util.promisify(request.get);
const post = util.promisify(request.post);

const consumer_key = process.env.TWITTER_API_KEY;
const consumer_secret = process.env.TWITTER_API_SECRET;

const bearerTokenURL = new URL(process.env.TWITTER_BEARER_TOKEN_URL);
const streamURL = new URL(process.env.TWITTER_STREAM_URL);
const rulesURL = new URL(process.env.TWITTER_RULES_URL);

const rules = [
  { 'value': 'dog has:images', 'tag': 'dog pictures' },
  { 'value': 'cat has:images -grumpy', 'tag': 'cat pictures' },
];

/**
 * Wrapper for connecting to Twitter API.
 */
class TwitterAPIClient {
  constructor() {
    this.timeout = 0;
    this.bearerToken;
    this.stream;
  }

  /**
  * Sets auth token
  *
  * @return {void}
  */
  async init() {
    try {
      const token = await this.requestBearerToken({consumer_key, consumer_secret});
      this.bearerToken = token;
      return;
    } catch (e) {
      console.error(`Could not generate a Bearer token. Please check that your credentials are correct and that the Filtered Stream preview is enabled in your Labs dashboard. (${e})`);
      return;
    }
  }

  /**
  * Emits HTTP request to Twitter for a Bearer token.
  *
  * @return {string}
  */
  async requestBearerToken (auth) {
    const requestConfig = {
      url: bearerTokenURL,
      auth: {
        user: consumer_key,
        pass: consumer_secret,
      },
      form: { grant_type: 'client_credentials' }
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

  async getAllRules() {
    const requestConfig = {
      url: rulesURL,
      auth: {
        bearer: this.bearerToken
      }
    };

    const response = await get(requestConfig);
    if (response.statusCode !== 200) {
      throw new Error(response.body);
      return null;
    }

    return JSON.parse(response.body);
  }

  async deleteAllRules(rules, token) {
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

  async setRules(rules, token) {
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

  streamConnect() {
    const config = {
      url: 'https://api.twitter.com/labs/1/tweets/stream/filter?format=detailed&tweet.format=detailed',
      auth: {
        bearer: this.bearerToken,
      },
      timeout: 20000,
    };

    return request.get(config);;
  }

  handleData(data) {
    try {
      const json = JSON.parse(data);
      console.log(json);
      if (json.connection_issue) {
        stream.emit('timeout');
      }

      return json;
    } catch (e) {
      console.log("Streaming error: ", e);
      // Heartbeat received. Do nothing.
    }
  }

  async handleTimeout() {
    // Reconnect on error
    console.warn('A connection error occurred. Reconnecting…');
    this.timeout++;
    this.stream.abort();
    await this.sleep((2 ** this.timeout) * 1000);
    this.listenToStream();
  }

  /**
  * Listen to the stream.
  * This reconnection logic will attempt to reconnect when a disconnection is detected.
  * To avoid rate limits, this implements exponential backoff.
  *
  * @return {void}
  */
  listenToStream() {
    try {
      this.stream = this.streamConnect();
      return;
    } catch (e) {
      console.log("eee", e);
      this.listenToStream();
    }
  }

  async sleep(delay) {
    return new Promise((resolve) =>
      setTimeout(() =>
        resolve(true), delay));
  }
}

module.exports = TwitterAPIClient;
