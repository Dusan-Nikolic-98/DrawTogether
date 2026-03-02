import { Server, Socket } from "socket.io";

type UserPayload = {
  id: string;
  username: string;
};

export const setupChatSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as UserPayload;

    // slanje poruke
    socket.on("chat_message", ({ pictureId, content }) => {
      if (!content?.trim()) return;
      console.log("od usera: " +user.username + " poruka: " + content + " za pictureId: " + pictureId);
      io.to(pictureId).emit("new_chat_message", {
        // user_id: user.id,
        username: user.username,
        content,
        // timestamp: Date.now(),
      });
    });
  });
};
