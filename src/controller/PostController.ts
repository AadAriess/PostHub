import { Request, Response } from "express";
import { Post } from "../entity/Post";
import { User } from "../entity/User";
import { Tag } from "../entity/Tag";
import { In } from "typeorm";

export class PostController {
  // GET /api/posts - Ambil semua post
  async getAll(req: Request, res: Response) {
    const posts = await Post.find({
      relations: { author: true, tags: true },
    });
    return res.json(posts);
  }

  // POST /api/posts - Membuat post baru
  async create(req: Request, res: Response) {
    const { title, content, authorId, tagIds, parentId } = req.body;

    const author = await User.findOneBy({ id: authorId });
    if (!author) {
      return res.status(404).json({ message: "User not found." });
    }

    if (parentId) {
      const parentPost = await Post.findOneBy({ id: parentId });
      if (!parentPost) {
        return res
          .status(400)
          .json({ message: `Parent Post with ID ${parentId} not found.` });
      }
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

    const newPost = Post.create({
      title,
      content,
      authorId: author.id,
      author: author,
      tags: tags,
      parentId: parentId || null,
    });
    await newPost.save();

    return res.status(201).json(newPost);
  }

  // GET /api/posts/:id - Ambil post berdasarkan ID
  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);

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

    let post = await Post.findOne({
      where: { id },
      relations: { tags: true },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (title) post.title = title;
    if (content) post.content = content;

    if (tagIds !== undefined) {
      let newTags: Tag[] = [];

      if (tagIds.length > 0) {
        newTags = await Tag.findBy({ id: In(tagIds) });

        if (newTags.length !== tagIds.length) {
          return res
            .status(400)
            .json({ message: "One or more tag IDs are invalid" });
        }

        post.tags = newTags;
      }
    }

    await post.save();

    const updatePost = await Post.findOne({
      where: { id: post.id },
      relations: { author: true, tags: true },
    });

    return res.json(updatePost);
  }

  // DELETE /api/posts/:id - Menghapus post berdasarkan ID
  async deletePost(req: Request, res: Response) {
    const id = parseInt(req.params.id);

    const post = await Post.findOneBy({ id });

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const result = await post.remove();

    return res.status(204).send();
  }
}
