import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Picture } from "./Picture";

// Entitet za korisnike (User tabela)
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid") // Automatski generisan ID kao primarni ključ
  id: string;

  @Column({ unique: true }) // Korisničko ime mora biti jedinstveno
  username: string;

  @Column() // Kolona za čuvanje lozinke (hashirana)
  password: string;

  @OneToMany(() => Picture, (picture) => picture.author)
  pictures: Picture[];
}
