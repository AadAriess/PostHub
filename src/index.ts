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
import * as path from "path";
import * as cors from "cors";
import { FeedResolver } from "./resolver/FeedResolver";
import { FollowResolver } from "./resolver/FollowResolver";

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

  // CORS Configuration
  app.use(
    cors({
      origin: [
        "http://localhost:3000", // frontend Next.js
        "https://studio.apollographql.com", // Apollo Sandbox
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Serve static file upload
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // Middleware untuk JSON & REST API
  app.use("/api", express.json(), RestRoutes);

  // GraphQL Schema
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      TagResolver,
      PostResolver,
      CommentResolver,
      NotificationResolver,
      LogHistoryResolver,
      FeedResolver,
      FollowResolver,
    ],
    validate: false,
    authChecker: customAuthChecker,
  });

  // Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    context: ({ req }): IContext => {
      const payload = verifyTokenCore(req);
      return { payload };
    },
    introspection: true, // Bolehkan introspeksi di semua lingkungan
  });

  await apolloServer.start();

  // Apply middleware TANPA override cors
  apolloServer.applyMiddleware({
    app,
    path: "/graphql",
    cors: false,
  });

  // Socket.io + HTTP Server
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
