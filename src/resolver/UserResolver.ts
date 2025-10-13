import "dotenv/config";
import { Resolver, Query, Mutation, Arg, Int } from "type-graphql";
import { User } from "../entity/User";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { AuthResponse } from "../types/AuthResponse";
import { RegisterInput } from "../types/RegisterInput";
import { UpdateUserInput } from "../types/UpdateUserInput";

const JWT_SECRET = process.env.JWT_SECRET;

@Resolver(User) // Menghubungkan resolver ini dengan tipe User
export class UserResolver {
  // --- QUERY (Ambil Data) ---
  // Query untuk mengambil semua user
  @Query(() => [User])
  async users(): Promise<User[]> {
    return User.find();
  }

  // Query untuk mengambil satu user berdasarkan ID
  @Query(() => User, { nullable: true })
  async user(@Arg("id", () => Int) id: number): Promise<User | null> {
    return User.findOneBy({ id });
  }

  // --- MUTATION (Manipulasi Data) ---
  // Mutation untuk membuat user baru
  @Mutation(() => AuthResponse)
  async register(@Arg("data") data: RegisterInput): Promise<AuthResponse> {
    // Cek Email
    const existingUser = await User.findOneBy({ email: data.email });
    if (existingUser) {
      throw new Error("Email sudah terdaftar.");
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Buat User
    const newUser = User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      email: data.email,
      password: hashedPassword,
      address: data.address,
    });
    await newUser.save();

    // Buat Token JWT
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, user: newUser };
  }

  // Mutation untuk login
  @Mutation(() => AuthResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<AuthResponse> {
    // Cek Email
    const user = await User.findOneBy({ email });

    if (!user) {
      throw new Error("Kredensial tidak valid.");
    }

    // Validasi Password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Kredensial tidak valid.");
    }

    // Buat token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return { token, user: user };
  }

  // Mutation untuk mengupdate user
  @Mutation(() => User, { nullable: true })
  async updateUser(@Arg("data") data: UpdateUserInput): Promise<User | null> {
    const user = await User.findOneBy({ id: data.id });
    if (!user) {
      throw new Error("User tidak ditemukan.");
    }

    Object.assign(user, data);

    await user.save();
    return user;
  }

  // Mutation untuk menghapus user
  @Mutation(() => Boolean)
  async deleteUser(@Arg("id", () => Int) id: number): Promise<boolean> {
    const result = await User.delete(id);
    return result.affected !== 0;
  }
}
