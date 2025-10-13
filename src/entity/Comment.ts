import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ObjectType, Field, ID, Int, registerEnumType } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";
import { GraphQLJSONObject } from "graphql-type-json";

export enum CommentStatus {
  APPROVED = "APPROVED",
  PENDING = "PENDING",
  SPAM = "SPAM",
}
registerEnumType(CommentStatus, { name: "CommentStatus" });

@ObjectType()
@Entity()
export class Comment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("text")
  content: string;

  @Field(() => CommentStatus)
  @Column({ type: "enum", enum: CommentStatus, default: CommentStatus.PENDING })
  status: CommentStatus;

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: "json", nullable: true })
  mentions: number[] | null;

  @Field(() => Int)
  @Column()
  authorId: number;

  @Field(() => Int)
  @Column()
  postId: number;

  // Many-to-One: Hanya memiliki 1 Author
  @Field(() => User)
  @ManyToOne(() => User)
  author: User;

  // Many-to-One: Hanya memiliki 1 Parent (Komentar Induk)
  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  // Many-to-One: Hanya memiliki 1 Parent (Komentar Induk)
  @Field(() => Comment, { nullable: true })
  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  parent: Comment;

  // Foreign Key untuk Parent Comment
  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  parentId: number | null;

  // One-to-Many: Dapat memiliki banyak Balasan (Anak)
  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  // Kolom Waktu
  @Field()
  @CreateDateColumn()
  createdAt: Date;

  // Kolom Waktu
  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
