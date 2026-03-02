import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { apiError } from "../helpers/errors";

// Tip za očekivani payload JWT tokena
interface TokenPayload {
  id: number;
  username: string;
}

// Middleware za validaciju JWT tokena
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1]; // Dobijamo token iz header-a

  if (!token) {
    // return res.status(401).json({ message: "Nije obezbeđen token." });
    return res.status(401).json(apiError("NOT_AUTHENTICATED"));
  }

  try {
    const decoded = jwt.verify(token, "secret"); // Verifikujemo token

    // Proveravamo da li decoded ima očekivanu strukturu
    if (
      typeof decoded === "string" ||
      !("id" in decoded && "username" in decoded)
    ) {
      // return res.status(401).json({ message: "Nevažeći token." });
      return res.status(401).json(apiError("NOT_AUTHENTICATED"));
    }

    // Koristimo cast za TokenPayload
    req.user = decoded as TokenPayload;

    next(); // Nastavljamo dalje
  } catch (error) {
    // return res.status(401).json({ message: "Nevažeći token." });
    return res.status(401).json(apiError("NOT_AUTHENTICATED"));
  }
};
