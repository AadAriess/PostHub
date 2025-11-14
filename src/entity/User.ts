import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, ID } from "type-graphql";
import { Post } from "./Post";
import { GraphQLJSONObject } from "graphql-type-json";
import { Notification } from "./Notification";
import { Follower } from "./Follower";
import { FilterPreset } from "./FilterPreset";

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

  @Field(() => GraphQLJSONObject, { nullable: true })
  @Column({ type: "json", nullable: true })
  address: {
    street: string;
    city: string;
    country: string;
  } | null;

  @Field()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  // One-to-Many
  // User memiliki banyak Post
  @OneToMany(() => Post, (post) => post.author, {
    onDelete: "CASCADE",
  })
  posts: Post[];

  // One-to-Many
  // User menerima notifikasi
  @Field(() => [Notification])
  @OneToMany(() => Notification, (notification) => notification.recipient)
  notifications: Notification[];

  // Relasi Follower
  @OneToMany(() => Follower, (follow) => follow.follower)
  following: Follower[];

  // Relasi Following
  @OneToMany(() => Follower, (follow) => follow.following)
  followers: Follower[];

  // Relasi FilterPreset
  @OneToMany(() => FilterPreset, (preset) => preset.user)
  filterPresets: FilterPreset[];
}
