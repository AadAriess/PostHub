import { Resolver, Query, Arg, Int } from "type-graphql";
import { Post } from "../entity/Post";
import { Comment } from "../entity/Comment";

@Resolver(Post)
export class PostResolver {
  // --- QUERY (Ambil Data) ---
  // Query untuk mengambil satu Post beserta seluruh komentar (level 1 dan balasan)
  @Query(() => Post, { nullable: true })
  async getPostWithComments(
    @Arg("id", () => Int) id: number
  ): Promise<Post | null> {
    // 1. Muat Postingan Utama dan relasi non-komentar
    const post = await Post.findOne({
      where: { id: id },
      relations: {
        author: true,
        tags: true,
      },
    });

    if (!post) {
      return null;
    }

    // 2. Muat Komentar Level 1 secara terpisah dengan filtering
    const commentsLevelOne = await Comment.find({
      where: {
        post: { id: id },
        parentId: null,
      },
      relations: {
        author: true,
        replies: {
          author: true,
          replies: {
            author: true,
          },
        },
      },
    });

    // 3. Pasangkan hasil filter ke Post.comments
    post.comments = commentsLevelOne;

    return post;
  }
}
