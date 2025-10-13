import { Resolver, Mutation, Arg, Int } from "type-graphql";
import { Comment, CommentStatus } from "../entity/Comment";
import { User } from "../entity/User";
import { Post } from "../entity/Post";
import { isContentSpam } from "../utils/keywordFilter";
import { Notification, NotificationType } from "../entity/Notification";

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

    const post = await Post.findOne({
      where: { id: postId },
      relations: { author: true },
    });

    if (!author || !post || !post.author) {
      throw new Error(
        "Author or Post not found, or Post author data is missing."
      );
    }

    // Cek Konten Spam
    let status: CommentStatus = CommentStatus.APPROVED; // Default: Approved

    if (isContentSpam(content)) {
      // Jika mengandung kata terlarang, set status menjadi PENDING
      status = CommentStatus.PENDING;
    }

    let parentComment: Comment | null = null;
    if (parentId) {
      parentComment = await Comment.findOne({
        where: { id: parentId },
        relations: { author: true },
      });
      if (!parentComment) {
        throw new Error("Parent comment not found.");
      }
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

    let recipient: User | null = null;
    let notificationType: NotificationType = NotificationType.COMMENT;
    let entityType: string = "Post";
    let entityId: number = postId;

    // Jika ada ParentId, ini adalah balasan (reply)
    if (parentComment) {
      // Penerima adalah penulis komentar induk
      recipient = parentComment.author;
      notificationType = NotificationType.COMMENT;
      entityType = "Comment";
      entityId = parentComment.id;

      // Jika tidak ada ParentId, ini adalah komentar level 1 di postingan
    } else {
      // Penerima adalah penulis postingan
      recipient = post.author;
      notificationType = NotificationType.COMMENT;
      entityType = "Post";
      entityId = postId;
    }

    // Buat notifikasi HANYA jika penerima BUKAN penulis komentar
    if (recipient && recipient.id !== author.id) {
      const newNotification = Notification.create({
        type: notificationType,
        recipientId: recipient.id,
        triggererId: author.id,

        // Relasi Polimorfik
        entityType: entityType,
        entityId: entityId,

        // Metadata tambahan
        metadata: {
          postTitle: post.title,
          commentPreview: content.substring(0, 50) + "...",
        },
      });

      await newNotification.save();
    }

    return newComment;
  }
}
