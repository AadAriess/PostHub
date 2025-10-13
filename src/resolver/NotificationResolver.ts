import { Resolver, Query, Int, Arg, Ctx } from "type-graphql";
import { Notification } from "../entity/Notification";
import { IContext } from "../types";

@Resolver(Notification)
export class NotificationResolver {
  @Query(() => [Notification], {
    description: "Mengambil daftar notifikasi untuk user yang login",
  })
  async myNotifications(
    @Ctx() { payload }: IContext,
    @Arg("limit", () => Int, { defaultValue: 10 }) limit: number,
    @Arg("offset", () => Int, { defaultValue: 0 }) offset: number
  ): Promise<Notification[]> {
    // 1. Otentikasi & Otorisasi
    if (!payload || !payload.userId) {
      throw new Error(
        "UNAUTHORIZED: Anda harus login untuk melihat notifikasi."
      );
    }
    const recipientId = payload.userId;

    // 2. Mengambil data notifikasi dari database
    const notifications = await Notification.find({
      where: { recipientId: recipientId },

      relations: {
        triggerer: true,
        recipient: true,
      },

      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return notifications;
  }
}
