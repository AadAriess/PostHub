import { Router } from "express";
import { PostController } from "./controller/PostController";

const router = Router();
const postController = new PostController();

// Endpoint GET untuk mengambil semua post
router.get("/posts", postController.getAll);

// Endpoint POST untuk membuat post baru
router.post("/posts", postController.create);

// Endpoint PUT untuk update post
router.put("/posts/:id", postController.updatePost);

// Endpoint GET untuk mengambil post berdasarkan ID
router.get("/posts/:id", postController.getById);

export default router;
