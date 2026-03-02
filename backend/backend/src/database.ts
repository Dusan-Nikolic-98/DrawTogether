import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Message } from "./entities/Message";
import { Picture } from "./entities/Picture";
import { PictureComment } from "./entities/PictureComment";
import { PictureLikeNew } from "./entities/PictureLikeNew";
// import { PictureLike } from "./entities/PictureLike";
// import { PictureComment } from "./entities/PictureComment";

// Konfigurišemo bazu podataka sa TypeORM
export const AppDataSource = new DataSource({
  type: "postgres", // Koristimo PostgreSQL kao bazu podataka
  host: "db", // "db" je ime servisa u docker-compose fajlu
  port: 5432, // Port na kojem PostgreSQL sluša
  username: "postgres", // Korisničko ime za bazu podataka
  password: "postgres", // Lozinka za bazu podataka
  database: "chatapp", // Ime baze podataka
  synchronize: true, // Automatska sinhronizacija entiteta (ne koristiti u produkciji)
  entities: [User, Message, Picture, PictureComment, PictureLikeNew], // Registrujemo entitete
});
