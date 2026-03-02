import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Picture {
  @PrimaryGeneratedColumn("uuid")
  picture_id: string;

  @Column({ length: 40 })
  name: string;

  // json string u bazi (string[][])
  @Column("jsonb")
  picture_data: string[][];

  @ManyToOne(() => User, (user) => user.pictures, { onDelete: "CASCADE" })
  author: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
