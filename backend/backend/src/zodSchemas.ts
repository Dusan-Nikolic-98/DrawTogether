import { z } from "zod";

// Šema za validaciju podataka prilikom registracije korisnika
export const signupSchema = z.object({
  username: z.string().min(1, "Korisničko ime je obavezno"), // Korisničko ime mora biti ne-prazno
  password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"), // Lozinka mora imati minimum 6 karaktera
});

// Šema za validaciju podataka prilikom prijave
export const loginSchema = signupSchema;

// Šema za validaciju podataka poruka
export const messageSchema = z.object({
  username: z.string().min(1, "Korisničko ime je obavezno"), // Korisničko ime je obavezno
  content: z.string().min(1, "Poruka ne može biti prazna"), // Sadržaj poruke ne može biti prazan
  password: z
    .string()
    .min(8, "Lozinka mora imati najmanje 8 karaktera")
    .max(128, "Lozinka ne sme imati više od 128 karaktera"),
});

//za slike

export const basePictureSchema = z.object({
  name: z.string().min(1).max(40),
  picture_data: z
    .array(
      z.array(
        z
          .string()
          .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Neispravan format boje")
      )
    )
    .refine((matrix) => {
      // mora biti kvadratna matrica
      if (matrix.length === 0) return false;
      if (matrix.length > 24) return false;
      return matrix.every((row) => row.length === matrix.length && row.length <= 24);
    }, "Matrica mora biti kvadratna do 24x24"),
});

// za post pic
export const newPictureSchema = basePictureSchema;

// za PATCH /pictures/:pictureId - update slike (parcijalni update)
export const updatePictureSchema = basePictureSchema.partial().refine(
  (data) => Object.keys(data).length > 0, 
  "Barem jedan field mora da postoji za update"
);