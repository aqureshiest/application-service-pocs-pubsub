import { RedisPubSub } from "graphql-redis-subscriptions";
const pubsub = new RedisPubSub({
  connection: {
    host: "127.0.0.1",
    port: 6379,
    retry_strategy: (options) => {
      // reconnect after
      return Math.max(options.attempt * 100, 3000);
    },
  },
});

console.log("attempting to publish event");
pubsub.publish("POST_ADDED", {
  postAdded: {
    id: 3,
    contents: "EXTERNAL process post",
  },
});
