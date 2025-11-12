import { Router } from "express";
import { PostController } from "./controller/PostController";
import { authMiddleware } from "./middleware/authMiddleware";
import { uploadMiddleware } from "./middleware/uploadMiddleware";

const router = Router();
const postController = new PostController();

// Endpoint GET untuk mengambil semua post (PUBLIK)
router.get("/posts", postController.getAll);

// Endpoint GET untuk search post
// PUBLIK, bisa tanpa auth
router.get("/posts/search", postController.searchPosts);

// Endpoint POST untuk membuat post baru
// Hanya pengguna yang terautentikasi yang dapat membuat post
router.post(
  "/posts",
  authMiddleware,
  uploadMiddleware.single("image"),
  postController.create
);

// Endpoint PUT untuk update post
// Hanya pengguna terautentikasi (dan pemilik) yang dapat mengupdate
router.put(
  "/posts/:id",
  authMiddleware,
  uploadMiddleware.single("image"),
  postController.updatePost
);

// Endpoint GET untuk mengambil post berdasarkan ID (PUBLIK)
router.get("/posts/:id", postController.getById);

// Endpoint DELETE untuk menghapus post
router.delete("/posts/:id", authMiddleware, postController.deletePost);

export default router;
