import { Resolver, Query, Mutation, Arg, Int } from "type-graphql";
import { User } from "../entity/User";

@Resolver(User) // Menghubungkan resolver ini dengan tipe User
export class UserResolver {
  // --- QUERY (Ambil Data) ---
  // Query untuk mengambil semua user
  @Query(() => [User])
  async users(): Promise<User[]> {
    // Menggunakan TypeORM (BaseEntity) untuk mengambil semua data
    return User.find();
  }

  // Query untuk mengambil satu user berdasarkan ID
  @Query(() => User, { nullable: true })
  async user(@Arg("id", () => Int) id: number): Promise<User | null> {
    return User.findOneBy({ id });
  }

  // --- MUTATION (Manipulasi Data) ---
  // Mutation untuk membuat user baru
  @Mutation(() => User)
  async createUser(
    @Arg("firstName") firstName: string,
    @Arg("lastName") lastName: string,
    @Arg("age", () => Int) age: number
  ): Promise<User> {
    const newUser = User.create({ firstName, lastName, age });
    await newUser.save();
    return newUser;
  }

  // Mutation untuk menghapus user
  @Mutation(() => Boolean)
  async deleteUser(@Arg("id", () => Int) id: number): Promise<boolean> {
    const result = await User.delete(id);
    return result.affected !== 0;
  }
}
