import { Resolver, Query, Ctx } from "type-graphql";
import { Post } from "../entity/Post";
import { Follower } from "../entity/Follower";
import { GraphQLError } from "graphql";
import { getCachedFeed, setCachedFeed } from "../cache/feedCache";

@Resolver()
export class FeedResolver {
  // Query untuk mengambil feed user yang diikuti
  @Query(() => [Post])
  async feed(@Ctx() context: any): Promise<Post[]> {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    const userId = payload.userId;

    // Cek cache feed terlebih dahulu
    const cachedFeed = await getCachedFeed(userId);
    if (cachedFeed) {
      console.log(`CACHE HIT feed:${userId}`);
      return cachedFeed;
    }

    // Ambil semua user yang diikuti oleh user login
    const following = await Follower.find({
      where: { follower: { id: userId } },
      relations: ["following"],
    });

    const followingIds = following.map((f) => f.following.id);
    if (followingIds.length === 0) return [];

    // Ambil post dari author yang diikuti
    const posts = await Post.createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.tags", "tags")
      .where("post.authorId IN (:...ids)", { ids: followingIds })
      .orderBy("post.createdAt", "DESC")
      .getMany();

    // Simpan ke cache sebelum mengembalikan
    await setCachedFeed(userId, posts);

    return posts;
  }
}
