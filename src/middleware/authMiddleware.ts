import { Request, Response, NextFunction } from "express";
import { verifyTokenCore } from "../utils/jwtUtils";
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
  console.log("Authorization header:", req.headers["authorization"]);

  const payload = verifyTokenCore(req);

  if (!payload) {
    return res
      .status(401)
      .json({ message: "Authentication required or token invalid." });
  }

  // Jika sukses: Lampirkan payload ke req.user dan lanjutkan
  req.user = payload;
  next();
};
