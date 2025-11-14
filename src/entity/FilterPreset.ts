import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { ObjectType, Field, ID } from "type-graphql";
import GraphQLJSON from "graphql-type-json";

@ObjectType()
@Entity()
export class FilterPreset extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field(() => GraphQLJSON)
  @Column({ type: "json" })
  filters!: any;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.filterPresets)
  user: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
