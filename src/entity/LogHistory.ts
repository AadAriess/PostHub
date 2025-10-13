import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from "typeorm";
import { Field, ObjectType, Int } from "type-graphql";
import { GraphQLJSONObject } from "graphql-type-json";

@ObjectType()
@Entity()
export class LogHistory extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  // Menunjukkan tipe entitas yang diubah (misalnya, 'Post', 'User')
  @Field()
  @Column()
  entityType!: string;

  // ID dari entitas yang diubah
  @Field(() => Int)
  @Column()
  entityId!: number;

  // ID pengguna yang melakukan perubahan
  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  changerId?: number;

  // Data perubahan dalam format JSON
  @Field(() => GraphQLJSONObject)
  @Column({ type: "json" })
  changes!: {
    old: Record<string, any>;
    new: Record<string, any>;
    action: string;
    details: string;
  };

  @Field()
  @CreateDateColumn()
  timestamp!: Date;
}
