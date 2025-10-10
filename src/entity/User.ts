import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field()
  @Column()
  age: number;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // One-to-Many
  // User memiliki banyak Post
  @OneToMany(() => Post, (post) => post.author, {
    onDelete: "CASCADE",
  })
  posts: Post[];
}
