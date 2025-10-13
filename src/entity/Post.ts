import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Tag } from "./Tag";
import { Comment } from "./Comment";
import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column("text")
  content: string;

  // Many-to-One: Hanya memiliki 1 Author
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: "authorId" })
  author: User;

  @Column()
  authorId: number;

  // Many-to-Many: Tag Post
  @Field(() => [Tag])
  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable()
  tags: Tag[];

  // One-to-Many: Komentar Post (Baru!)
  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
