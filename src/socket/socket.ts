// src/socket/socket.ts
import { Server as HTTPServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

let io: IOServer | null = null;
const CHANNEL_POST_NEW = "posts:new";

export function initSocket(httpServer: HTTPServer) {
  if (io) return io;

  io = new IOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  sub.subscribe(CHANNEL_POST_NEW, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else console.log(`✅ Subscribed to Redis channel: ${CHANNEL_POST_NEW}`);
  });

  sub.on("message", (channel, message) => {
    if (channel === CHANNEL_POST_NEW && io) {
      try {
        const data = JSON.parse(message);
        io.emit("post:new", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("⚡ Socket connected:", socket.id);
    socket.on("disconnect", () =>
      console.log("❌ Socket disconnected:", socket.id)
    );
  });

  return io;
}

export async function publishNewPost(payload: any) {
  try {
    await pub.publish(CHANNEL_POST_NEW, JSON.stringify(payload));
  } catch (err) {
    console.error("publishNewPost error:", err);
  }
}
