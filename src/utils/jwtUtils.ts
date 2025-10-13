import * as jwt from "jsonwebtoken";
import * as express from "express";
import { IAuthPayload } from "../types";

// Ambil secret key dari environment
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// Verifikasi token dan kembalikan payload
export const verifyTokenCore = (
  req: express.Request
): IAuthPayload | undefined => {
  try {
    const authHeader = req.headers["authorization"];

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

      if (decoded && decoded.userId) {
        let userIdNumber =
          typeof decoded.userId === "string"
            ? parseInt(decoded.userId)
            : (decoded.userId as number);

        return {
          userId: userIdNumber,
          email: (decoded.email as string) || "",
        };
      }
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};
