import express from "express";
import { signup, login } from "../controllers/authController";
import { validateSchema } from "../middlewares/zodMiddleware";
import { signupSchema, loginSchema } from "../zodSchemas";

const router = express.Router();

// Ruta za registraciju korisnika
router.post("/register", validateSchema(signupSchema), signup);

// Ruta za prijavu korisnika
router.post("/login", validateSchema(loginSchema), login);

export default router;
