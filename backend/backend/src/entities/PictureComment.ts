// entities/PictureComment.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class PictureComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  pictureId: string;

  @Column()
  username: string;

  @Column("text")
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}