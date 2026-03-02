import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Picture } from "../entities/Picture";
import { User } from "../entities/User";
import { apiError } from "../helpers/errors";
import { newPictureSchema, updatePictureSchema } from "../zodSchemas";
import jwt from "jsonwebtoken";
// import { PictureLike } from "../entities/PictureLikeNew";
import { PictureComment } from "../entities/PictureComment";
import { PictureLikeNew } from "../entities/PictureLikeNew";

const pictureRepository = AppDataSource.getRepository(Picture);
const userRepository = AppDataSource.getRepository(User);
const pictureCommentRepository = AppDataSource.getRepository(PictureComment);
const pictureLikeRepository = AppDataSource.getRepository(PictureLikeNew);

// giv mi user
async function getAuthUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, "secret");
    const user = await userRepository.findOneBy({ id: decoded.id });
    return user || null;
  } catch {
    return null;
  }
}

//POST /pictures/ za kreiranje slike
export const createPicture = async (req: Request, res: Response) => {
    try{
        const user = await getAuthUser(req);
        if(!user) return res.status(401).json(apiError("NOT_AUTHENTICATED"));

        const validated = newPictureSchema.parse(req.body);

        //cuvanje
        const picture = pictureRepository.create({
            name: validated.name,
            picture_data: validated.picture_data,
            author: user,
        });
        await pictureRepository.save(picture);

        res.status(201).json({
            failed: false,
            picture_id: picture.picture_id,
        });
    }catch(error: any){
        if (error.name === "ZodError") {
            if (error.errors.some((e: any) => e.message === "BAD_PICTURE_DATA")) {
                return res.status(400).json(apiError("BAD_PICTURE_DATA", error.errors));
            }
            return res.status(400).json(apiError("INVALID_DATA", error.errors));
        }
        console.error(error);
        res.status(500).json(apiError("INTERNAL_ERROR"));
    }
};

// GET /pictures/ – listanje sa paginacijom i filterima
export const listPictures = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 25);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const authorId = req.query.author as string | undefined;
    const olderFirst = req.query.older_first === "true";

    const where = authorId ? { author: { id: authorId } } : {};

    const [pictures, total] = await pictureRepository.findAndCount({
      where,
      relations: ["author"],
      order: { created_at: olderFirst ? "ASC" : "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
    //   failed: false,
      pictures: pictures.map((p) => ({
        picture_id: p.picture_id,
        name: p.name,
        picture_data: p.picture_data,
        author: { user_id: p.author.id, username: p.author.username },
        created_at: p.created_at,
        updated_at: p.updated_at,
      })),
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};

// GET /pictures/:pictureId
export const getPicture = async (req: Request, res: Response) => {
  try {
    const picture = await pictureRepository.findOne({
      where: { picture_id: req.params.pictureId },
      relations: ["author"],
    });

    if (!picture) return res.status(404).json(apiError("NO_SUCH_ENTITY"));

    res.json({
      failed: false,
      picture: {
        picture_id: picture.picture_id,
        name: picture.name,
        picture_data: picture.picture_data,
        author: { user_id: picture.author.id, username: picture.author.username },
        created_at: picture.created_at,
        updated_at: picture.updated_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};

// PATCH /pictures/:pictureId
export const updatePicture = async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json(apiError("NOT_AUTHENTICATED"));

    const picture = await pictureRepository.findOne({
      where: { picture_id: req.params.pictureId },
      relations: ["author"],
    });
    if (!picture) return res.status(404).json(apiError("NO_SUCH_ENTITY"));
    if (picture.author.id !== user.id) return res.status(403).json(apiError("NOT_YOURS"));

    const validated = updatePictureSchema.parse(req.body);

    if (validated.name !== undefined) picture.name = validated.name;
    if (validated.picture_data !== undefined) picture.picture_data = validated.picture_data;

    await pictureRepository.save(picture);

    res.json({ failed: false });
  } catch (error: any) {
    if (error.name === "ZodError") {
      if (error.errors.some((e: any) => e.message === "BAD_PICTURE_DATA")) {
        return res.status(400).json(apiError("BAD_PICTURE_DATA", error.errors));
      }
      return res.status(400).json(apiError("INVALID_DATA", error.errors));
    }
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};


// DELETE /pictures/:pictureId
export const deletePicture = async (req: Request, res: Response) => {
  try {
    const user = await getAuthUser(req);
    if (!user) return res.status(401).json(apiError("NOT_AUTHENTICATED"));

    const picture = await pictureRepository.findOne({
      where: { picture_id: req.params.pictureId },
      relations: ["author"],
    });
    if (!picture) return res.status(404).json(apiError("NO_SUCH_ENTITY"));
    if (picture.author.id !== user.id) return res.status(403).json(apiError("NOT_YOURS"));

    await pictureRepository.remove(picture);

    res.json({ failed: false });
  } catch (error) {
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};

// komentariiii
// GET /comments - dohvatanje komentara
export const getAllComments = async (req: Request, res: Response) => {
  try {
    const comments = await pictureCommentRepository.find({
      order: { createdAt: "DESC" } // najnoviji prvi
    });

    res.json({
      failed: false,
      comments: comments.map(comment => ({
        id: comment.id,
        pictureId: comment.pictureId,
        username: comment.username,
        comment: comment.comment,
        createdAt: comment.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};

// GET /likes - dohvatanje like-ova/dislike-ova
export const getAllLikes = async (req: Request, res: Response) => {
  try {
    const likes = await pictureLikeRepository.find({
      order: { createdAt: "DESC" }
    });

    res.json({
      failed: false,
      likes: likes.map(like => ({
        id: like.id,
        pictureId: like.pictureId,
        username: like.username,
        isLiked: like.isLiked,
        createdAt: like.createdAt
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(apiError("INTERNAL_ERROR"));
  }
};