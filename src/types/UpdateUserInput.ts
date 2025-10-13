import { InputType, Field, Int } from "type-graphql";
import { AddressInput } from "./AddressInput";

@InputType()
export class UpdateUserInput {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field(() => Int, { nullable: true })
  age?: number;

  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;
}
