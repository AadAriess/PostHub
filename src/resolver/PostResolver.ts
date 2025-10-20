import { Resolver, Query, Arg, Int } from "type-graphql";
import { Post } from "../entity/Post";
import { Comment } from "../entity/Comment";
import { InputType, Field } from "type-graphql";
import { Like, Between, LessThan } from "typeorm";

@InputType()
class FilterConditionInput {
  @Field()
  field: string;

  @Field()
  operator: string;

  @Field(() => [String], { nullable: true })
  values?: string[];
}

@InputType()
class FilterGroupInput {
  @Field()
  operator: string;

  @Field(() => [FilterConditionInput], { nullable: true })
  conditions?: FilterConditionInput[];

  @Field(() => [FilterGroupInput], { nullable: true })
  groups?: FilterGroupInput[];
}

@Resolver(Post)
export class PostResolver {
  // --- QUERY (Ambil Data) ---
  // Filter Posts dengan kondisi kompleks
  @Query(() => [Post])
  async filterPosts(
    @Arg("filters", () => FilterGroupInput) filters: FilterGroupInput
  ): Promise<Post[]> {
    const qb = Post.createQueryBuilder("post")
      .leftJoinAndSelect("post.author", "author")
      .leftJoinAndSelect("post.tags", "tags");

    // Fungsi rekursif untuk membangun WHERE secara dinamis
    function buildWhere(
      group: FilterGroupInput,
      params: Record<string, any> = {},
      alias = "post",
      depth = 0
    ): { expr: string; params: Record<string, any> } {
      const parts: string[] = [];

      group.conditions?.forEach((cond, i) => {
        const key = `${cond.field}_${depth}_${i}`;

        // Filter tanggal
        if (cond.field === "createdAt") {
          if (cond.operator === "between" && cond.values?.length === 2) {
            parts.push(
              `${alias}.createdAt BETWEEN :${key}_start AND :${key}_end`
            );
            params[`${key}_start`] = new Date(cond.values[0]);
            params[`${key}_end`] = new Date(cond.values[1]);
          } else if (cond.operator === "before" && cond.values?.[0]) {
            parts.push(`${alias}.createdAt < :${key}`);
            params[key] = new Date(cond.values[0]);
          } else if (cond.operator === "after" && cond.values?.[0]) {
            parts.push(`${alias}.createdAt > :${key}`);
            params[key] = new Date(cond.values[0]);
          }
        }

        // Filter title contains
        if (
          cond.field === "title" &&
          cond.operator === "contains" &&
          cond.values?.[0]
        ) {
          parts.push(`LOWER(${alias}.title) LIKE LOWER(:${key})`);
          params[key] = `%${cond.values[0]}%`;
        }

        // Filter tags contains
        if (
          cond.field === "tags" &&
          cond.operator === "contains" &&
          cond.values?.length
        ) {
          const tagParam = `${key}_tags`;
          const subAlias = `subTag_${depth}_${i}`;
          parts.push(`
          EXISTS (
            SELECT 1 FROM post_tags_tag ptt
            INNER JOIN tag ${subAlias} ON ${subAlias}.id = ptt.tagId
            WHERE ptt.postId = ${alias}.id
            AND LOWER(${subAlias}.name) IN (:...${tagParam})
          )
        `);
          params[tagParam] = cond.values.map((v) => v.toLowerCase());
        }
      });

      // Nested groups (AND/OR logic)
      group.groups?.forEach((sub, j) => {
        const nested = buildWhere(sub, params, alias, depth + j + 1);
        parts.push(`(${nested.expr})`);
        Object.assign(params, nested.params);
      });

      return {
        expr: parts.length ? parts.join(` ${group.operator} `) : "1=1",
        params,
      };
    }

    // Bangun where expression dan parameter
    const { expr, params } = buildWhere(filters);

    // Jalankan query
    qb.where(expr, params).orderBy("post.id", "DESC");

    const results = await qb.getMany();
    return results;
  }

  // Mengambil semua Post
  @Query(() => [Post], {
    description: "Mengambil daftar semua Post tanpa memuat semua komentar",
  })
  async getAllPosts(): Promise<Post[]> {
    const posts = await Post.find({
      relations: { author: true, tags: true },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,

        author: {
          id: true,
          firstName: true,
          lastName: true,
        },

        tags: {
          id: true,
          name: true,
        },
      },
      order: { id: "DESC" },
    });

    return posts;
  }

  // Mengambil satu Post beserta seluruh komentar (detail)
  @Query(() => Post, { nullable: true })
  async getPostWithComments(
    @Arg("id", () => Int) id: number
  ): Promise<Post | null> {
    const post = await Post.findOne({
      where: { id },
      relations: {
        author: true,
        tags: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imagePath: true,
        authorId: true,
        author: {
          id: true,
          firstName: true,
          lastName: true,
        },
        tags: { id: true, name: true },
      },
    });

    if (!post) return null;

    const allComments = await Comment.find({
      where: { post: { id } },
      relations: { author: true },
      order: { id: "ASC" },
    });

    // Menambahkan properti replyToUser pada komentar
    for (const comment of allComments) {
      if (comment.parentId) {
        const parent = allComments.find((c) => c.id === comment.parentId);
        if (parent && parent.author) {
          comment.replyToUser = parent.author.firstName;
        }
      }
    }

    (post as any).comments = allComments;

    return post;
  }
}
