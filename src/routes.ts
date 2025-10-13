import { Router } from "express";
import { PostController } from "./controller/PostController";
import { authMiddleware } from "./middleware/authMiddleware";

const router = Router();
const postController = new PostController();

// Endpoint GET untuk mengambil semua post (PUBLIK)
router.get("/posts", postController.getAll);

// Endpoint POST untuk membuat post baru
// Hanya pengguna yang terautentikasi yang dapat membuat post
router.post("/posts", authMiddleware, postController.create);

// Endpoint PUT untuk update post
// Hanya pengguna terautentikasi (dan pemilik) yang dapat mengupdate
router.put("/posts/:id", authMiddleware, postController.updatePost);

// Endpoint GET untuk mengambil post berdasarkan ID (PUBLIK)
router.get("/posts/:id", postController.getById);

export default router;
