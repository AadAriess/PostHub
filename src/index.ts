import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import { buildSchema } from "type-graphql";

// Import koneksi TypeORM
import { AppDataSource } from "./data-source";

// Import Resolver
import { UserResolver } from "./resolver/UserResolver";
import { TagResolver } from "./resolver/TagResolver";
import { PostResolver } from "./resolver/PostResolver";
import { CommentResolver } from "./resolver/CommentResolver";

// Import Routes REST
import RestRoutes from "./routes";

async function main() {
  // 1. Inisialisasi Koneksi Database TypeORM
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source TypeORM terinisialisasi.");
  } catch (error) {
    console.error("❌ Error saat inisialisasi Data Source:", error);
    return;
  }

  // 2. Setup Server Express
  const app = express();

  // 3. Daftarkan Routes RESTful
  app.use("/api", express.json(), RestRoutes);

  // 4. Setup GraphQL (Seperti sebelumnya)
  const schema = await buildSchema({
    resolvers: [UserResolver, TagResolver, PostResolver, CommentResolver],
    validate: false,
  });

  const server = new ApolloServer({ schema });

  // 5. Terapkan Middleware Apollo Server
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  // 6. Jalankan Server
  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}/`);
    console.log(`💻 GraphQL Playground: http://localhost:${PORT}/graphql`);
    console.log(`🌐 REST API Endpoints: http://localhost:${PORT}/api/posts`);
  });
}

main().catch((error) => console.log(error));
