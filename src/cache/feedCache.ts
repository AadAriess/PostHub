import { redis } from "../utils/redisClient";
import { Follower } from "../entity/Follower";

const FEED_TTL = 30; // 30 detik
const feedKey = (userId: number) => `feed:${userId}`;

// Ambil cache feed user
export async function getCachedFeed(userId: number) {
  const data = await redis.get(feedKey(userId));
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Set feed user
export async function setCachedFeed(userId: number, feed: any) {
  await redis.set(feedKey(userId), JSON.stringify(feed), "EX", FEED_TTL);
}

// Hapus cache feed semua follower ketika author membuat postingan
export async function invalidateFeedCacheForFollowers(authorId: number) {
  const followers = await Follower.find({
    where: { followingId: authorId },
  });

  if (followers.length === 0) return;

  const pipeline = redis.pipeline();
  followers.forEach((f) => {
    pipeline.del(feedKey(f.followerId));
  });

  await pipeline.exec();
}

// Hapus cache feed user tertentu
export async function invalidateFeedForUser(userId: number) {
  await redis.del(feedKey(userId));
}
