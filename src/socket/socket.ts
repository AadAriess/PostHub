import { Server as HTTPServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const pub = new Redis(redisUrl);
const sub = new Redis(redisUrl);

let io: IOServer | null = null;
const CHANNEL_POST_NEW = "posts:new";
const CHANNEL_POST_UPDATE = "posts:update";
const CHANNEL_POST_DELETE = "posts:delete";
const CHANNEL_COMMENT_NEW = "comments:new";
const CHANNEL_COMMENT_UPDATE = "comments:update";
const CHANNEL_COMMENT_DELETE = "comments:delete";

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

  sub.subscribe(CHANNEL_POST_UPDATE, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else console.log(`✅ Subscribed to Redis channel: ${CHANNEL_POST_UPDATE}`);
  });

  sub.subscribe(CHANNEL_POST_DELETE, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else console.log(`✅ Subscribed to Redis channel: ${CHANNEL_POST_DELETE}`);
  });

  sub.subscribe(CHANNEL_COMMENT_NEW, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else console.log(`✅ Subscribed to Redis channel: ${CHANNEL_COMMENT_NEW}`);
  });

  sub.subscribe(CHANNEL_COMMENT_UPDATE, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else
      console.log(`✅ Subscribed to Redis channel: ${CHANNEL_COMMENT_UPDATE}`);
  });

  sub.subscribe(CHANNEL_COMMENT_DELETE, (err) => {
    if (err) console.error("Redis subscribe error:", err);
    else
      console.log(`✅ Subscribed to Redis channel: ${CHANNEL_COMMENT_DELETE}`);
  });

  sub.on("message", (channel, message) => {
    if (channel === CHANNEL_POST_NEW && io) {
      try {
        const data = JSON.parse(message);
        io.emit("post:new", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    } else if (channel === CHANNEL_POST_UPDATE && io) {
      try {
        const data = JSON.parse(message);
        io.emit("post:update", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    } else if (channel === CHANNEL_POST_DELETE && io) {
      try {
        const data = JSON.parse(message);
        io.emit("post:delete", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    } else if (channel === CHANNEL_COMMENT_NEW && io) {
      try {
        const data = JSON.parse(message);
        io.emit("comment:new", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    } else if (channel === CHANNEL_COMMENT_UPDATE && io) {
      try {
        const data = JSON.parse(message);
        io.emit("comment:update", data);
      } catch (err) {
        console.error("Invalid Redis message:", err);
      }
    } else if (channel === CHANNEL_COMMENT_DELETE && io) {
      try {
        const data = JSON.parse(message);
        io.emit("comment:delete", data);
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

export async function publishUpdatedPost(payload: any) {
  try {
    await pub.publish(CHANNEL_POST_UPDATE, JSON.stringify(payload));
  } catch (err) {
    console.error("publishUpdatedPost error:", err);
  }
}

export async function publishDeletedPost(payload: any) {
  try {
    await pub.publish(CHANNEL_POST_DELETE, JSON.stringify(payload));
  } catch (err) {
    console.error("publishDeletedPost error:", err);
  }
}

export async function publishNewComment(payload: any) {
  try {
    await pub.publish(CHANNEL_COMMENT_NEW, JSON.stringify(payload));
  } catch (err) {
    console.error("publishNewComment error:", err);
  }
}

export async function publishUpdatedComment(payload: any) {
  try {
    await pub.publish(CHANNEL_COMMENT_UPDATE, JSON.stringify(payload));
  } catch (err) {
    console.error("publishUpdatedComment error:", err);
  }
}

export async function publishDeletedComment(payload: any) {
  try {
    await pub.publish(CHANNEL_COMMENT_DELETE, JSON.stringify(payload));
  } catch (err) {
    console.error("publishDeletedComment error:", err);
  }
}
