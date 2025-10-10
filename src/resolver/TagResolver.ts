import { Resolver, Query, Mutation, Arg, Int } from "type-graphql";
import { Tag } from "../entity/Tag";

@Resolver(Tag) // Menghubungkan resolver ini dengan tipe Tag
export class TagResolver {
  // --- QUERY (Ambil Data) ---
  // Query untuk mengambil semua tag
  @Query(() => [Tag])
  async tags(): Promise<Tag[]> {
    // Menggunakan TypeORM (BaseEntity) untuk mengambil semua data
    return Tag.find();
  }

  // --- MUTATION (Manipulasi Data) ---
  // Mutation untuk membuat tag baru
  @Mutation(() => Tag)
  async createTag(@Arg("name") name: string): Promise<Tag> {
    const existingTag = await Tag.findOneBy({ name });
    if (existingTag) {
      throw new Error(`Tag with name ${name} already exists.`);
    }

    const newTag = Tag.create({ name });
    await newTag.save();

    return newTag;
  }

  // Mutation untuk menghapus user
  @Mutation(() => Boolean)
  async deleteTag(@Arg("id", () => Int) id: number): Promise<boolean> {
    const result = await Tag.delete(id);
    return result.affected !== 0;
  }
}
