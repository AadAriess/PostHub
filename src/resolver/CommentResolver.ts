import { Resolver, Mutation, Arg, Int, Ctx, Authorized } from "type-graphql";
import { IContext } from "../types";
import { Comment, CommentStatus } from "../entity/Comment";
import { User } from "../entity/User";
import { Post } from "../entity/Post";
import { isContentSpam } from "../utils/keywordFilter";
import { Notification, NotificationType } from "../entity/Notification";
import { compareEntities, createLog } from "../utils/logUtils";

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

  // Mutation untuk memperbarui komentar
  @Authorized()
  @Mutation(() => Comment)
  async updateComment(
    @Ctx() { payload }: IContext,
    @Arg("commentId", () => Int) commentId: number,
    @Arg("content", { nullable: true }) content?: string,
    @Arg("status", () => CommentStatus, { nullable: true })
    status?: CommentStatus
  ): Promise<Comment> {
    const changerId = payload?.userId;
    if (!changerId) {
      throw new Error("UNAUTHORIZED: Anda harus login.");
    }

    let comment = await Comment.findOne({ where: { id: commentId } });

    if (!comment) {
      throw new Error("Comment not found.");
    }

    // Otorisasi: Hanya penulis komentar yang bisa mengedit
    if (comment.authorId !== changerId) {
      throw new Error(
        "FORBIDDEN: Anda hanya dapat mengedit komentar Anda sendiri."
      );
    }

    // Catat Data Lama
    const oldDataToLog = {
      content: comment.content,
      status: comment.status,
    };

    // Terapkan Perubahan
    if (content !== undefined) {
      comment.content = content;

      if (isContentSpam(content)) {
        comment.status = CommentStatus.PENDING;
      }
    }
    if (status !== undefined) {
      comment.status = status;
    }

    // Simpan Perubahan Utama
    await comment.save();

    // LOGGING: Gunakan utility global
    const changesData = compareEntities(oldDataToLog, comment, [
      "content",
      "status",
    ]);

    await createLog("Comment", comment.id, changerId, changesData, "UPDATE");

    return comment;
  }

  // Mutation untuk menghapus komentar
  @Authorized()
  @Mutation(() => Boolean)
  async deleteComment(
    @Ctx() { payload }: IContext,
    @Arg("commentId", () => Int) commentId: number
  ): Promise<boolean> {
    const currentUserId = payload?.userId;
    if (!currentUserId) {
      throw new Error("UNAUTHORIZED: Anda harus login.");
    }

    const comment = await Comment.findOne({ where: { id: commentId } });

    if (!comment) {
      return true;
    }

    // Otorisasi: Hanya penulis yang bisa menghapus
    if (comment.authorId !== currentUserId) {
      throw new Error(
        "FORBIDDEN: Anda hanya dapat menghapus komentar Anda sendiri."
      );
    }

    // Catat data komentar yang dihapus sebelum dihapus
    const deletedCommentData = {
      content: comment.content,
      status: comment.status,
      authorId: comment.authorId,
      postId: comment.postId,
    };

    // Hapus komentar dan semua balasannya
    await comment.remove();

    // LOGGING: Catat penghapusan
    const emptyChanges = { old: deletedCommentData, new: {} };
    await createLog(
      "Comment",
      commentId,
      currentUserId,
      emptyChanges,
      "DELETE"
    );

    return true;
  }
}
