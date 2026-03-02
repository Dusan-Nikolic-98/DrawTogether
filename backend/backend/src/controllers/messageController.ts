import { Request, Response } from "express";
import { AppDataSource } from "../database";
import { Message } from "../entities/Message";

const messageRepository = AppDataSource.getRepository(Message);

// Kontroler za dobijanje svih poruka
export const getMessages = async (req: Request, res: Response) => {
  try {
    const messages = await messageRepository.find({
      order: { createdAt: "ASC" },
    }); // Poruke sortirane po vremenu
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Greška pri dobijanju poruka." });
  }
};

// Kontroler za kreiranje nove poruke
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Poruka ne može biti prazna." });
    }

    const newMessage = messageRepository.create({
      username: req.user.username, // Korisnik iz tokena
      content,
    });

    await messageRepository.save(newMessage);
    res.status(201).json(newMessage); // Vraćamo kreiranu poruku
  } catch (error) {
    res.status(500).json({ message: "Greška pri kreiranju poruke." });
  }
};
