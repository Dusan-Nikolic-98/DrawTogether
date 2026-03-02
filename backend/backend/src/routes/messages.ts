import express from "express";
import { getMessages, createMessage } from "../controllers/messageController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateSchema } from "../middlewares/zodMiddleware";
import { messageSchema } from "../zodSchemas";

const router = express.Router();

// Ruta za dobijanje svih poruka
router.get("/", authMiddleware, getMessages);

// Ruta za kreiranje nove poruke
router.post("/", authMiddleware, validateSchema(messageSchema), createMessage);

export default router;
