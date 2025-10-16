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
      where: { id },
      relations: {
        author: true,
        tags: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imagePath: true,
        authorId: true,
        author: {
          id: true,
          firstName: true,
          lastName: true,
        },
        tags: { id: true, name: true },
      },
    });

    if (!post) return null;

    const allComments = await Comment.find({
      where: { post: { id } },
      relations: { author: true },
      order: { id: "ASC" },
    });

    // Menambahkan properti replyToUser pada komentar
    for (const comment of allComments) {
      if (comment.parentId) {
        const parent = allComments.find((c) => c.id === comment.parentId);
        if (parent && parent.author) {
          comment.replyToUser = parent.author.firstName;
        }
      }
    }

    (post as any).comments = allComments;

    return post;
  }
}
