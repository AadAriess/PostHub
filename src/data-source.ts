import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Post } from "./entity/Post";
import { Tag } from "./entity/Tag";
import { Comment } from "./entity/Comment";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "root",
  password: "",
  database: "test_type",
  synchronize: false,
  logging: false,
  entities: [User, Post, Tag, Comment],
  migrations: [],
  subscribers: [],
});
