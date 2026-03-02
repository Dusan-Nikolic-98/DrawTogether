import { Server, Socket } from "socket.io";
// import { addComment, addOrUpdateLike } from "../controllers/picturesController";
import { AppDataSource } from "../database";
import { PictureComment } from "../entities/PictureComment";
import { PictureLikeNew } from "../entities/PictureLikeNew";
// import { PictureLike } from "../entities/PictureLike";


type UserPayload = {
  id: string;
  username: string;
};

const pictureCommentRepository = AppDataSource.getRepository(PictureComment);
const pictureLikeRepository = AppDataSource.getRepository(PictureLikeNew);
// mapa: pictureId -> Map<userId, username>
const pictureUsers: Record<string, Map<string, string>> = {};

export const setupPicturesSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as UserPayload;

    // cika se pridruzuje odredjenoj slici (room = pictureId)
    socket.on("join_picture", (pictureId: string) => {
      socket.join(pictureId);

      if (!pictureUsers[pictureId]) {
        pictureUsers[pictureId] = new Map();
      }
      pictureUsers[pictureId].set(user.id, user.username);

      // update svima da je tip usao pa lista svih
      io.to(pictureId).emit("active_users", Array.from(pictureUsers[pictureId].values()));

      console.log(`${user.username} joined picture ${pictureId}`);
    });

    // napusta sliku
    socket.on("leave_picture", (pictureId: string) => {
      socket.leave(pictureId);

      if(pictureUsers[pictureId]){
        pictureUsers[pictureId].delete(user.id);
        io.to(pictureId).emit("active_users", Array.from(pictureUsers[pictureId].values()));
      }

      socket.to(pictureId).emit("user_left", {
        user_id: user.id
      });



    });

    // kursor
    socket.on("cursor_move", ({ pictureId, x, y }) => {
      socket.to(pictureId).emit("cursor_update", {
        user_id: user.id,
        username: user.username,
        x,
        y,
      });
    });

    // crtanje piksela
    socket.on("draw_pixel", ({ pictureId, x, y, color }) => {
      socket.to(pictureId).emit("pixel_drawn", {
        user_id: user.id,
        x,
        y,
        color,
      });
    });

    // kad se diskonektuje
    socket.on("disconnect", () => {
      //sve sobe gde je bio
      for (const [pictureId, users] of Object.entries(pictureUsers)) {
        if (users.has(user.id)) {
          users.delete(user.id);
          io.to(pictureId).emit("active_users", Array.from(users.values()));
        }
      }

      console.log(`User disconnected: ${user.username}`);
    });
    //za komentare delovi
    socket.on("add_comment", async (data: { pictureId: string; comment: string }) => {
      try {
        if (!data.comment?.trim()) {
          socket.emit("comment_error", { message: "Comment cannot be empty" });
          return;
        }

        // cuvanje komentara
        const newComment = pictureCommentRepository.create({
          pictureId: data.pictureId,
          username: user.username,
          comment: data.comment.trim()
        });

        await pictureCommentRepository.save(newComment);

        // emitovanje novog kom svima (ne samo u sobi)
        io.emit("new_comment", {
          id: newComment.id,
          pictureId: newComment.pictureId,
          username: newComment.username,
          comment: newComment.comment,
          createdAt: newComment.createdAt
        });

        console.log(`New comment by ${user.username} for picture ${data.pictureId}`);

      } catch (error) {
        console.error("Error adding comment:", error);
        socket.emit("comment_error", { message: "Failed to add comment" });
      }
    });

    //like deo
    socket.on("toggle_like", async (data: { pictureId: string; isLiked: boolean }) => {
      try {
        // da li vec postoji like ovog usera za ovu sliku
        const existingLike = await pictureLikeRepository.findOne({
          where: {
            pictureId: data.pictureId,
            username: user.username
          }
        });

        let likeToSave: PictureLikeNew;

        if (existingLike) {
          // ako postoji da se azurira
          existingLike.isLiked = data.isLiked;
          likeToSave = existingLike;
        } else {
          // ako no, da se kreira nov
          likeToSave = pictureLikeRepository.create({
            pictureId: data.pictureId,
            username: user.username,
            isLiked: data.isLiked
          });
        }

        await pictureLikeRepository.save(likeToSave);

        // emitovanje
        io.emit("like_updated", {
          id: likeToSave.id,
          pictureId: likeToSave.pictureId,
          username: likeToSave.username,
          isLiked: likeToSave.isLiked,
          createdAt: likeToSave.createdAt
        });

        console.log(`Like updated by ${user.username} for picture ${data.pictureId}: ${data.isLiked ? '👍' : '👎'}`);

      } catch (error) {
        console.error("Error toggling like:", error);
        socket.emit("like_error", { message: "Failed to toggle like" });
      }
    });

    
  });
};
