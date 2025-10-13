import { InputType, Field, Int } from "type-graphql";
import { AddressInput } from "./AddressInput";

@InputType()
export class RegisterInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => Int)
  age: number;

  @Field()
  email: string;

  @Field()
  password: string;

  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;
}
