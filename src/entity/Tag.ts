import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToMany,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Tag extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  // Many-to-Many
  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
