import express from "express";
import {
  createPicture,
  listPictures,
  getPicture,
  updatePicture,
  deletePicture,
  getAllComments,
  getAllLikes,
} from "../controllers/picturesController";
import { validateSchema } from "../middlewares/zodMiddleware";
import { newPictureSchema, updatePictureSchema } from "../zodSchemas";

const router = express.Router();

// nova slika
router.post("/", validateSchema(newPictureSchema), createPicture);

// listanje slika (bez auth)
router.get("/", listPictures);

// izmena slike
router.patch("/:pictureId", validateSchema(updatePictureSchema), updatePicture);

// brisanje
router.delete("/:pictureId", deletePicture);

// komentari get
router.get("/comments", getAllComments);

//lajkovi get
router.get("/likes", getAllLikes);

// dohvat 1 slike (bez auth)
router.get("/:pictureId", getPicture);

export default router;
