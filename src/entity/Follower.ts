import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  BaseEntity,
  Column,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Follower extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId!: number;

  @Column()
  followingId!: number;

  // Siapa yang mengikuti
  @ManyToOne(() => User, (user) => user.following, { onDelete: "CASCADE" })
  follower: User;

  // Siapa yang diikuti
  @ManyToOne(() => User, (user) => user.followers, { onDelete: "CASCADE" })
  following: User;

  @CreateDateColumn()
  createdAt: Date;
}
