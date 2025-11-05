import { Resolver, Mutation, Arg, Ctx, Query } from "type-graphql";
import { User } from "../entity/User";
import { Follower } from "../entity/Follower";
import { Int } from "type-graphql";
import { GraphQLError } from "graphql";
import { Not } from "typeorm";

@Resolver()
export class FollowResolver {
  // Query untuk Ambil semua user (kecuali user sendiri)
  @Query(() => [User])
  async allUsers(@Ctx() context: any): Promise<User[]> {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    const users = await User.find({
      where: { id: Not(payload.userId) },
    });

    return users;
  }

  // Query untuk Follow user
  @Mutation(() => Boolean)
  async followUser(
    @Arg("followingId", () => Int) followingId: number,
    @Ctx() context: any
  ) {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    const followerId = payload.userId;
    if (followerId === followingId)
      throw new GraphQLError("Tidak bisa follow diri sendiri.");

    const existing = await Follower.findOne({
      where: { follower: { id: followerId }, following: { id: followingId } },
      relations: ["follower", "following"],
    });

    if (existing) throw new GraphQLError("Sudah mengikuti user ini.");

    const follow = Follower.create({
      follower: { id: followerId },
      following: { id: followingId },
    });

    await follow.save();
    return true;
  }

  // Query untuk Unfollow user
  @Mutation(() => Boolean)
  async unfollowUser(
    @Arg("followingId", () => Int) followingId: number,
    @Ctx() context: any
  ) {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    await Follower.delete({
      follower: { id: payload.userId },
      following: { id: followingId },
    });

    return true;
  }

  // Query untuk List following (user yang user ikuti)
  @Query(() => [User])
  async getFollowingList(@Ctx() context: any): Promise<User[]> {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    const list = await Follower.find({
      where: { follower: { id: payload.userId } },
      relations: ["following"],
    });

    return list.map((f) => f.following);
  }

  // Query untuk List followers (user yang mengikuti user)
  @Query(() => [User])
  async getFollowerList(@Ctx() context: any): Promise<User[]> {
    const payload = context.payload;

    if (!payload?.userId) {
      throw new GraphQLError("Unauthorized");
    }

    const list = await Follower.find({
      where: { following: { id: payload.userId } },
      relations: ["follower"],
    });

    return list.map((f) => f.follower);
  }
}
