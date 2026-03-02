import { Server } from "socket.io";
import { AppDataSource } from "./database";
import { Message } from "./entities/Message";
import jwt from "jsonwebtoken";
import { setupPicturesSocket } from "./sockets/picturesSocket";
import { setupChatSocket } from "./sockets/chatSocket";

// Socket.IO setup for real-time communication
export const setupSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token?.split(" ")[1];
    if (!token) {
      return next(new Error("Token nije obezbeđen."));
    }

    try {
      const decoded = jwt.verify(token, "secret") as {
        id: string;
        username: string;
      };
      socket.data.user = decoded; // Dodajemo korisnika u socket.data
      next();
    } catch (error) {
      return next(new Error("Nevažeći token."));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.data.user.username}`);

    // Emit existing messages to the user on connection
    socket.on("loadMessages", async () => {
      const messageRepo = AppDataSource.getRepository(Message);
      const messages = await messageRepo.find({ order: { createdAt: "ASC" } });
      messages.forEach((msg) => {
        console.log(`Sending message: ${msg.content}`); // Log each message
        socket.emit("message", msg);
      });
    });

    // Handle new messages
    socket.on("message", async (data) => {
      try {
        const messageRepo = AppDataSource.getRepository(Message);
        const newMessage = messageRepo.create({
          username: socket.data.user.username,
          content: data.content,
        });

        await messageRepo.save(newMessage);
        console.log(`New message created: ${newMessage.content}`); // Log the new message
        io.emit("message", newMessage); // Broadcast to all users
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("error", { message: "Failed to send message." });
      }
    });
  });

  // crtanje
  setupPicturesSocket(io);

  // live chat
  setupChatSocket(io);
};
