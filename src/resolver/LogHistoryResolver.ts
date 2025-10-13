import { Resolver, Query, Arg, Int } from "type-graphql";
import { LogHistory } from "../entity/LogHistory";

@Resolver(LogHistory)
export class LogHistoryResolver {
  // Query untuk mengambil semua log
  @Query(() => [LogHistory], {
    description: "Mengambil semua riwayat perubahan (Audit Log).",
  })
  async getAllLogs(
    @Arg("limit", () => Int, { defaultValue: 20 }) limit: number,
    @Arg("offset", () => Int, { defaultValue: 0 }) offset: number
  ): Promise<LogHistory[]> {
    return LogHistory.find({
      take: limit,
      skip: offset,
      order: { timestamp: "DESC" },
    });
  }

  // Query untuk mengambil riwayat log spesifik per entitas
  @Query(() => [LogHistory], {
    description:
      "Mengambil riwayat log untuk entitas tertentu (misal: Post/User).",
  })
  async getLogsByEntity(
    @Arg("entityType") entityType: string,
    @Arg("entityId", () => Int) entityId: number
  ): Promise<LogHistory[]> {
    return LogHistory.find({
      where: {
        entityType: entityType,
        entityId: entityId,
      },
      order: { timestamp: "ASC" },
    });
  }
}
