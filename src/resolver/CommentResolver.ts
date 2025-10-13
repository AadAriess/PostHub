import { Resolver, Mutation, Arg, Int } from "type-graphql";
import { Comment, CommentStatus } from "../entity/Comment";
import { User } from "../entity/User";
import { Post } from "../entity/Post";
import { isContentSpam } from "../utils/keywordFilter";

@Resolver(Comment)
export class CommentResolver {
  // --- MUTATION (Manipulasi Data) ---
  // Mutation untuk membuat komentar baru
  @Mutation(() => Comment)
  async createComment(
    @Arg("content") content: string,
    @Arg("authorId", () => Int) authorId: number,
    @Arg("postId", () => Int) postId: number,
    @Arg("parentId", () => Int, { nullable: true }) parentId?: number
  ): Promise<Comment> {
    // Cek Author dan Post
    const author = await User.findOneBy({ id: authorId });
    const post = await Post.findOneBy({ id: postId });
    if (!author || !post) {
      throw new Error("Author or Post not found.");
    }

    // Cek Konten Spam
    let status: CommentStatus = CommentStatus.APPROVED; // Default: Approved

    if (isContentSpam(content)) {
      // Jika mengandung kata terlarang, set status menjadi PENDING
      status = CommentStatus.PENDING;
    }

    // Buat Komentar
    const newComment = Comment.create({
      content,
      author,
      post,
      parent: parentId ? ({ id: parentId } as Comment) : null,
      status,
    });

    await newComment.save();

    return newComment;
  }
}
