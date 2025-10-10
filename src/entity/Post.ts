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

@Entity()
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  content: string;

  // Many-to-One
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: "authorId" })
  author: User;

  @Column()
  authorId: number;

  // Many-to-Many
  @ManyToMany(() => Tag, (tag) => tag.posts)
  @JoinTable()
  tags: Tag[];

  // Self-Referencing (Tree Entity)
  // Many-to-One ke Post: Hanya memiliki 1 Parent
  @ManyToOne(() => Post, (post) => post.children, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "parentId" })
  parent: Post;

  @Column({ nullable: true })
  parentId: number | null;

  // One-to-Many ke Post: Dapat memiliki banyak Children
  @OneToMany(() => Post, (post) => post.parent)
  children: Post[];
}
