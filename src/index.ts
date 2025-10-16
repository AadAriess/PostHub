import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import { buildSchema, AuthChecker } from "type-graphql";
import "dotenv/config";
import RestRoutes from "./routes";
import { AppDataSource } from "./data-source";
import { IContext } from "./types";
import { UserResolver } from "./resolver/UserResolver";
import { TagResolver } from "./resolver/TagResolver";
import { PostResolver } from "./resolver/PostResolver";
import { NotificationResolver } from "./resolver/NotificationResolver";
import { LogHistoryResolver } from "./resolver/LogHistoryResolver";
import { CommentResolver } from "./resolver/CommentResolver";
import { verifyTokenCore } from "./utils/jwtUtils";
import * as http from "http";
import { initSocket } from "./socket/socket";

const customAuthChecker: AuthChecker<IContext> = ({ context }) => {
  return !!context.payload;
};

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source TypeORM terinisialisasi.");
  } catch (error) {
    console.error("❌ Error saat inisialisasi Data Source:", error);
    return;
  }

  const app = express();

  // Middleware & routes
  app.use("/api", express.json(), RestRoutes);

  // GraphQL setup
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      TagResolver,
      PostResolver,
      CommentResolver,
      NotificationResolver,
      LogHistoryResolver,
    ],
    validate: false,
    authChecker: customAuthChecker,
  });

  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }): IContext => {
      const payload = verifyTokenCore(req);
      return { payload };
    },
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  // Buat HTTP Server & inisialisasi Socket.IO
  const server = http.createServer(app);
  initSocket(server);

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

  server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}/`);
    console.log(`💻 GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`🌐 REST API Endpoints: http://localhost:${PORT}/api/posts`);
    console.log(`⚡ Socket.IO aktif di ws://localhost:${PORT}`);
  });
}

main().catch((error) => console.log(error));
