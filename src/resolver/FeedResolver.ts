import { Resolver, Query, Ctx } from "type-graphql";
import { Post } from "../entity/Post";
import { Follower } from "../entity/Follower";
import { GraphQLError } from "graphql";

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

    return posts;
  }
}
