import { Resolver, Query, Arg, Int } from "type-graphql";
import { Post } from "../entity/Post";
import { Comment } from "../entity/Comment";

@Resolver(Post)
export class PostResolver {
  // --- QUERY (Ambil Data) ---
  // Mengambil semua Post
  @Query(() => [Post], {
    description: "Mengambil daftar semua Post tanpa memuat semua komentar",
  })
  async getAllPosts(): Promise<Post[]> {
    const posts = await Post.find({
      relations: { author: true, tags: true },
      select: {
        id: true,
        title: true,
        content: true,

        author: {
          id: true,
          firstName: true,
          lastName: true,
        },

        tags: {
          id: true,
          name: true,
        },
      },
      order: { id: "DESC" },
    });

    return posts;
  }

  // Mengambil satu Post beserta seluruh komentar (detail)
  @Query(() => Post, { nullable: true })
  async getPostWithComments(
    @Arg("id", () => Int) id: number
  ): Promise<Post | null> {
    const post = await Post.findOne({
      where: { id: id },
      relations: {
        author: true,
        tags: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
        author: {
          id: true,
          firstName: true,
          lastName: true,
        },
        tags: { id: true, name: true },
      },
    });

    if (!post) {
      return null;
    }

    // Muat Komentar Level 1 secara terpisah dengan filtering
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

    // Pasangkan hasil filter ke Post.comments
    (post as any).comments = commentsLevelOne;

    return post;
  }
}
