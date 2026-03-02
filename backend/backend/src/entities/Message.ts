import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// Entitet za poruke (Message tabela)
@Entity()
export class Message {
  @PrimaryGeneratedColumn() // Automatski generisan ID kao primarni ključ
  id: number;

  @Column() // Korisničko ime osobe koja je poslala poruku
  username: string;

  @Column() // Sadržaj poruke
  content: string;

  @CreateDateColumn() // Automatski popunjena kolona za datum i vreme kreiranja poruke
  createdAt: Date;
}
