import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, } from "typeorm";

@Entity()
export class PictureLikeNew {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  pictureId: string;

  @Column()
  username: string;

  @Column()
  isLiked: boolean;

  @CreateDateColumn()
  createdAt: Date;
}