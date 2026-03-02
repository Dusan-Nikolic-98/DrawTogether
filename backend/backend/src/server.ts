import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./database";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/messages";
import { setupSocket } from "./socket";
import { apiError } from "./helpers/errors"
import pictureRoutes from "./routes/pictures";

const app = express(); // Kreiramo Express aplikaciju
const httpServer = createServer(app); // HTTP server za rad sa Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Dozvoljavamo pristup sa frontend domena
    methods: ["GET", "POST", "PATCH", "DELETE"], // Dozvoljeni HTTP metodi
    credentials: true, // Ako koristimo kolačiće ili autentifikaciju
  },
});

// Enable CORS
app.use(
  cors({
    origin: "*", // Dozvoljavamo zahteve sa frontend domena
    methods: ["GET", "POST", "PATCH", "DELETE"], // Dozvoljeni HTTP metodi
  })
);

app.use(express.json()); // Middleware za parsiranje JSON podataka
app.use("/auth", authRoutes); // Ruta za autentifikaciju
app.use("/messages", messageRoutes); // Ruta za poruke
app.use("/pictures", pictureRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Greška:", err);

  if (err.name === "ZodError") {
    return res.status(400).json(apiError("INVALID_DATA", err.errors));
  }

  return res.status(500).json(apiError("INTERNAL_ERROR"));
});

// Inicijalizacija baze podataka
AppDataSource.initialize()
  .then(() => {
    console.log("Baza podataka povezana");
    setupSocket(io); // Postavljamo Socket.io za real-time komunikaciju

    // Pokretanje servera
    httpServer.listen(3001, () => {
      console.log("Server radi na http://localhost:3001");
    });
  })
  .catch((error) => console.error("Greška pri povezivanju sa bazom:", error));
