import * as express from "express";

// Definišemo proširenje za `Request` tip kako bismo dodali `user` polje
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
      };
    }
  }
}
