import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import { buildSchema } from "type-graphql";
import "dotenv/config";
import * as jwt from "jsonwebtoken";

// Import koneksi TypeORM
import { AppDataSource } from "./data-source";

// Import Type dan Interface Context
import { IContext, IAuthPayload } from "./types";

// Import Resolver
import { UserResolver } from "./resolver/UserResolver";
import { TagResolver } from "./resolver/TagResolver";
import { PostResolver } from "./resolver/PostResolver";
import { CommentResolver } from "./resolver/CommentResolver";

// Import Routes REST
import RestRoutes from "./routes";
import { NotificationResolver } from "./resolver/NotificationResolver";

// Ambil secret key dari environment
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// Fungsi untuk mengambil dan memverifikasi token dari header Authorization
const verifyToken = (req: Request): IAuthPayload | undefined => {
  try {
    const authHeader = req.headers["authorization"];

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      // Verifikasi token
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      // Cek apakah userId ada
      if (decoded && decoded.userId) {
        let userIdNumber: number;

        if (typeof decoded.userId === "string") {
          userIdNumber = parseInt(decoded.userId);
        } else if (typeof decoded.userId === "number") {
          userIdNumber = decoded.userId;
        } else {
          return undefined;
        }

        return {
          userId: userIdNumber,
          email: (decoded.email as string) || "",
        };
      }
    }

    // Jika tidak ada header atau format salah
    return undefined;
  } catch (error) {
    // Jika token tidak valid, expired, atau format salah
    return undefined;
  }
};

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

  // 4. Setup GraphQL
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      TagResolver,
      PostResolver,
      CommentResolver,
      NotificationResolver,
    ],
    validate: false,
  });

  const server = new ApolloServer({
    schema,
    context: ({ req }): IContext => {
      // Memanggil fungsi untuk memverifikasi token dan mendapatkan payload
      const payload = verifyToken(req);

      // Objek context yang akan diteruskan ke semua resolvers
      return { payload };
    },
  });

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
