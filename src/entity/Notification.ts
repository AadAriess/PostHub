import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Int } from "type-graphql";
import { ObjectType, Field, ID, registerEnumType } from "type-graphql";
import { GraphQLJSONObject } from "graphql-type-json";
import { User } from "./User";

export enum NotificationType {
  COMMENT = "COMMENT",
  MENTION = "MENTION",
}
registerEnumType(NotificationType, { name: "NotificationType" });

@ObjectType()
@Entity()
export class Notification extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => NotificationType)
  @Column({ type: "enum", enum: NotificationType })
  type: NotificationType;

  @Field(() => GraphQLJSONObject)
  @Column({ type: "json", nullable: true })
  metadata: Record<string, any>;

  @Field()
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  // Relasi Polimorfik (Konseptual)
  // Digunakan frontend untuk tahu ke mana harus navigasi
  @Field()
  @Column()
  entityType: string;

  @Field(() => Int)
  @Column()
  entityId: number;

  // Relasi Many-to-One
  // Penerima Notifikasi
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "recipientId" })
  recipient: User;

  @Column()
  recipientId: number;

  // Relasi Many-to-One
  // Pemicu Notifikasi (Siapa yang melakukan aksi)
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "triggererId" })
  triggerer: User;

  @Column({ nullable: true })
  triggererId: number | null;
}
