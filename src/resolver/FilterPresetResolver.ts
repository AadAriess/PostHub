import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { FilterPreset } from "../entity/FilterPreset";
import { GraphQLJSONObject } from "graphql-type-json";
import { Int } from "type-graphql";

@Resolver(FilterPreset)
export class FilterPresetResolver {
  // --- QUERY (Ambil Data) ---
  // Ambil semua preset filter milik user yang sedang login
  @Authorized()
  @Query(() => [FilterPreset])
  async myFilterPresets(@Ctx() context: any): Promise<FilterPreset[]> {
    const userId = context.payload?.userId;
    if (!userId) throw new Error("Unauthorized");

    return FilterPreset.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  // --- MUTATION (Manipulasi Data) ---
  // Simpan preset filter baru
  @Authorized()
  @Mutation(() => FilterPreset)
  async saveFilterPreset(
    @Arg("name") name: string,
    @Arg("filters", () => GraphQLJSONObject) filters: object,
    @Ctx() context: any
  ): Promise<FilterPreset> {
    const userId = context.payload?.userId;
    if (!userId) throw new Error("Unauthorized");

    const preset = FilterPreset.create({
      name,
      filters,
      user: { id: userId } as any,
    });

    await preset.save();
    return preset;
  }

  // Hapus preset filter milik user yang sedang login
  @Authorized()
  @Mutation(() => Boolean)
  async deleteFilterPreset(
    @Arg("id", () => Int) id: number,
    @Ctx() context: any
  ): Promise<boolean> {
    const userId = context.payload?.userId;
    if (!userId) throw new Error("Unauthorized");

    const preset = await FilterPreset.findOne({
      where: { id, user: { id: userId } },
    });

    if (!preset) return false;
    await preset.remove();
    return true;
  }
}
