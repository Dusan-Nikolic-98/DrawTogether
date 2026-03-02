import bcrypt from "bcryptjs"; // Koristimo bcryptjs umesto bcrypt
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { User } from "../entities/User";
import { signupSchema, loginSchema } from "../zodSchemas";
import { apiError } from "../helpers/errors";

const userRepository = AppDataSource.getRepository(User);

function checkAlreadyLoggedIn(req: Request, res: Response): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, "secret");
      res.status(400).json(apiError("LOGGED_IN"));
      return true;
    } catch {
      // token postoji ali je nevazeci
    }
  }
  return false;
}

export const signup = async (req: Request, res: Response) => {
  try {
    if (checkAlreadyLoggedIn(req, res)) return;

    const validatedData = signupSchema.parse(req.body);

    const existingUser = await userRepository.findOneBy({
      username: validatedData.username,
    });
    if (existingUser) {
      return res.status(409).json(apiError("DUPLICATE_USERNAME"));
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const newUser = userRepository.create({
      username: validatedData.username,
      password: hashedPassword,
    });
    await userRepository.save(newUser);

    res.status(201).json({
      failed: false,
      user_id: newUser.id,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json(apiError("INVALID_DATA", error.errors));
    }
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};


export const login = async (req: Request, res: Response) => {
  try {
    if (checkAlreadyLoggedIn(req, res)) return;

    const validatedData = loginSchema.parse(req.body);

    const user = await userRepository.findOneBy({
      username: validatedData.username,
    });

    if (!user || !(await bcrypt.compare(validatedData.password, user.password))) {
      return res.status(401).json(apiError("INCORRECT_CREDENTIALS"));
    }

    const token = jwt.sign({ id: user.id, username: user.username }, "secret", {
      expiresIn: "1h",
    });

    res.json({
      failed: false,
      token,
      user_id: user.id,
      username: user.username,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json(apiError("INVALID_DATA", error.errors));
    }
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};