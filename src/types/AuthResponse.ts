import { ObjectType, Field } from "type-graphql";
import { User } from "../entity/User";

@ObjectType()
export class AuthResponse {
  @Field()
  token: string;

  @Field()
  user: User;
}
