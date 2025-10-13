import { Request, Response, NextFunction } from "express";
import { verifyTokenCore } from "../utils/jwtUtils"; // ⬅️ Import fungsi inti
import { IAuthPayload } from "../types";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthPayload;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Panggil logika inti verifikasi
  const payload = verifyTokenCore(req);

  if (!payload) {
    // Jika gagal, kirim error HTTP 401 dan hentikan request REST
    return res
      .status(401)
      .json({ message: "Authentication required or token invalid." });
  }

  // Jika sukses: Lampirkan payload ke req.user dan lanjutkan
  req.user = payload;
  next();
};
