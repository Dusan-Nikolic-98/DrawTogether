import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

// Middleware za validaciju ulaznih podataka sa Zod šemama
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body); // Validiramo telo zahteva prema šemi
      next(); // Ako je validacija uspešna, prelazimo na sledeći middleware
    } catch (error) {
      return res
        .status(400)
        .json({ message: "Validacija nije uspela.", error: error.errors });
    }
  };
};
