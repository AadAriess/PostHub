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
  @Column({
    type: "enum",
    enum: CommentStatus,
    default: CommentStatus.PENDING,
  })
  status: CommentStatus;

  @Field(() => Int)
  @Column()
  authorId: number;

  @Field(() => Int)
  @Column()
  postId: number;

  // Many-to-One: Author
  @Field(() => User)
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  author: User;

  // Many-to-One: Post
  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: "CASCADE" })
  post: Post;

  // Many-to-One: Parent Comment (Komentar Induk)
  @Field(() => Comment, { nullable: true })
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: "CASCADE",
  })
  parent?: Comment;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  parentId?: number | null;

  // One-to-Many: Replies (Komentar Balasan)
  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.parent, {
    cascade: true,
  })
  replies?: Comment[];

  @Field({ nullable: true })
  replyToUser?: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
