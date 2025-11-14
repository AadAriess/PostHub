import { Request, Response } from "express";
import { Post } from "../entity/Post";
import { User } from "../entity/User";
import { Tag } from "../entity/Tag";
import { In } from "typeorm";
import {
  publishNewPost,
  publishUpdatedPost,
  publishDeletedPost,
} from "../socket/socket";
import { compareEntities, createLog } from "../utils/logUtils";
import { getSuggestedTags } from "../utils/aiTagSuggestion";
import * as fs from "fs";
import * as path from "path";
import esClient from "../lib/esClient";
import { invalidateFeedCacheForFollowers } from "../cache/feedCache";

export class PostController {
  // GET /api/posts - Ambil semua post
  async getAll(req: Request, res: Response) {
    const posts = await Post.find({
      relations: { author: true, tags: true },

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

        tags: {
          id: true,
          name: true,
        },
      },
    });

    return res.json(posts);
  }

  // POST /api/posts - Membuat post baru
  async create(req: Request, res: Response) {
    try {
      const { title, content, authorId, tagIds } = req.body;

      const author = await User.findOneBy({ id: authorId });
      if (!author) {
        return res.status(404).json({ message: "User not found." });
      }

      let tags: Tag[] = [];
      if (tagIds && tagIds.length > 0) {
        tags = await Tag.findBy({ id: In(tagIds) });

        if (tags.length !== tagIds.length) {
          return res
            .status(400)
            .json({ message: "One or more tag IDs are invalid." });
        }
      }

      const { id, firstName, lastName } = author;
      const authorForPost = { id, firstName, lastName };
      const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

      const newPost = Post.create({
        title,
        content,
        imagePath,
        authorId: author.id,
        author: authorForPost,
        tags: tags,
      });

      await newPost.save();

      // Index post ke Elasticsearch
      await esClient.index({
        index: "posts",
        id: newPost.id.toString(),
        document: {
          title: newPost.title,
          content: newPost.content,
          author: {
            id: author.id,
            firstName: author.firstName,
            lastName: author.lastName,
          },
        },
      });

      if (content && content.length > 20) {
        const suggested = await getSuggestedTags(content);

        if (suggested.length > 0) {
          for (const tagName of suggested) {
            // Cek apakah tag sudah ada
            let tag = await Tag.findOneBy({ name: tagName });
            if (!tag) {
              tag = Tag.create({ name: tagName });
              await tag.save();
            }

            // Cegah duplikasi tag
            if (!newPost.tags.some((t) => t.name === tag.name)) {
              newPost.tags.push(tag);
            }
          }

          await newPost.save();
        }
      }

      // Invalidate feed cache untuk followers author
      await invalidateFeedCacheForFollowers(author.id);

      // Siapkan payload yang akan dikirim ke client
      const payload = {
        id: newPost.id,
        title: newPost.title,
        content: newPost.content,
        imagePath: newPost.imagePath,
        author: authorForPost,
        tags: tags.map((t) => ({ id: t.id, name: t.name })),
        createdAt: (newPost as any).createdAt || new Date().toISOString(),
      };

      // Publish event ke Redis -> akan diteruskan ke Socket.IO
      publishNewPost(payload).catch((e) => {
        console.error("Failed to publish new post:", e);
      });

      return res.status(201).json(newPost);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  }

  // GET /api/posts/:id - Ambil post berdasarkan ID
  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid post ID." });
    }

    const post = await Post.findOne({
      where: { id },
      relations: { author: true, tags: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    return res.json(post);
  }

  // PUT /api/posts/:id - Memperbarui post
  async updatePost(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const { title, content, tagIds } = req.body;

    const currentUserId = req.user?.userId;
    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    let post = await Post.findOne({
      where: { id },
      relations: { tags: true, author: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Simpan data lama (buat logging)
    const oldDataToLog = {
      title: post.title,
      content: post.content,
      tags: [...post.tags],
      imagePath: post.imagePath,
    };

    // Update teks (title, content)
    if (title) post.title = title;
    if (content) post.content = content;

    // Update tag (jika ada)
    if (tagIds !== undefined) {
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        const newTags = await Tag.findBy({ id: In(tagIds) });
        if (newTags.length !== tagIds.length) {
          return res
            .status(400)
            .json({ message: "One or more tag IDs are invalid" });
        }
        post.tags = newTags;
      } else {
        post.tags = [];
      }
    }

    // Update gambar (jika upload baru)
    if (req.file) {
      const newImagePath = `/uploads/${req.file.filename}`;

      // Hapus gambar lama
      if (post.imagePath) {
        const oldFilePath = path.join(
          __dirname,
          "../../public",
          post.imagePath
        );
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`🧹 Deleted old image: ${oldFilePath}`);
          }
        } catch (err) {
          console.error("❌ Failed to delete old image:", err);
        }
      }

      post.imagePath = newImagePath;
    }

    // Simpan perubahan ke DB
    await post.save();

    // Update index Elasticsearch
    await esClient.update({
      index: "posts",
      id: post.id.toString(),
      doc: {
        title: post.title,
        content: post.content,
        author: {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
        },
      },
    });

    // Catat log
    const changesData = compareEntities(
      oldDataToLog,
      post,
      ["title", "content", "imagePath"],
      ["tags"]
    );
    if (Object.keys(changesData).length > 0) {
      await createLog("Post", post.id, currentUserId, changesData, "UPDATE");
    }

    // Publish event update ke Redis → Socket.IO
    await publishUpdatedPost({
      id: post.id,
      title: post.title,
      content: post.content,
      imagePath: post.imagePath,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
      },
      tags: post.tags.map((t) => ({ id: t.id, name: t.name })),
      createdAt: post.createdAt,
      updatedAt: new Date().toISOString(),
    });

    // Invalidate feed cache untuk followers author
    await invalidateFeedCacheForFollowers(post.author.id);

    return res.json(post);
  }

  // DELETE /api/posts/:id - Menghapus post berdasarkan ID
  async deletePost(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const currentUserId = req.user?.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const post = await Post.findOne({
      where: { id },
      relations: { author: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Pastikan hanya author yang bisa hapus
    if (post.author.id !== currentUserId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post." });
    }

    // Hapus file gambar (kalau ada)
    if (post.imagePath) {
      const filePath = path.join(__dirname, "../../public", post.imagePath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Deleted image: ${filePath}`);
        }
      } catch (err) {
        console.error("❌ Failed to delete image:", err);
      }
    }

    // Hapus post (otomatis cascade ke comment)
    await Post.delete({ id });

    // Hapus dari Elasticsearch
    await esClient
      .delete({
        index: "posts",
        id: post.id.toString(),
      })
      .catch((err) => {
        // Jika dokumen belum ada di index, abaikan error
        if (err.meta?.statusCode !== 404) console.error(err);
      });

    // Publish event ke Redis -> akan diteruskan ke Socket.IO
    publishDeletedPost({ id: post.id }).catch((e) => {
      console.error("Failed to publish new post:", e);
    });

    // Invalidate feed cache untuk followers author
    await invalidateFeedCacheForFollowers(post.author.id);

    return res.json({ message: "✅ Post deleted successfully." });
  }

  // GET /api/posts/search?q=keyword
  async searchPosts(req: Request, res: Response) {
    try {
      const q = req.query.q?.toString().trim() || "";
      if (!q) return res.json([]);

      const result = await esClient.search({
        index: "posts",
        query: {
          multi_match: {
            query: q,
            fields: ["title", "content"],
            fuzziness: "AUTO",
          },
        },
        size: 50, // batas maksimal hasil pencarian
      });

      const hits = result.hits.hits.map((hit) => {
        const source = hit._source as {
          title: string;
          content: string;
          author?: { id: string; firstName: string; lastName: string };
        };

        const rawId = hit._id;
        const numericId = Number(rawId);
        const id = !isNaN(numericId) ? numericId : rawId;

        return {
          id,
          title: source.title || "",
          content: source.content || "",
          author: source.author || null,
        };
      });

      return res.json(hits);
    } catch (err) {
      console.error("Error searchPosts:", err);
      return res.status(500).json({
        error: "Terjadi kesalahan saat mencari posts",
      });
    }
  }
}
