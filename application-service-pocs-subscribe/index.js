import { ApolloServer, gql } from "apollo-server-express";
import { createServer } from "http";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import express from "express";

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

const typeDefs = gql`
  type Post {
    id: ID!
    contents: String!
  }

  type Subscription {
    postAdded: Post
  }

  type Mutation {
    addPost(id: ID, contents: String): Post
  }

  type Query {
    posts: [Post]
  }
`;

const posts = [
  {
    id: 1,
    contents: "This is the first post",
  },
];

const resolvers = {
  Query: {
    posts: () => posts,
  },

  Mutation: {
    addPost: (_, post) => {
      posts.push(post);

      console.log("about to publish subscription update event");
      pubsub.publish("POST_ADDED", {
        postAdded: {
          id: post.id,
          contents: post.contents,
        },
      });
      return post;
    },
  },

  Subscription: {
    postAdded: {
      subscribe: () => pubsub.asyncIterator(["POST_ADDED"]),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
const serverCleanup = useServer({ schema }, wsServer);

const server = new ApolloServer({
  schema,
  csrfPrevention: true,
  cache: "bounded",
  plugins: [
    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },

    ApolloServerPluginLandingPageLocalDefault({ embed: true }),
  ],
});

await server.start();
server.applyMiddleware({ app });

const PORT = 4000;
// Now that our HTTP server is fully set up, we can listen to it.
httpServer.listen(PORT, () => {
  console.log(
    `Server is now running on http://localhost:${PORT}${server.graphqlPath}`
  );
});
