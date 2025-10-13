import { InputType, Field } from "type-graphql";

@InputType()
export class AddressInput {
  @Field()
  street: string;

  @Field()
  city: string;

  @Field()
  country: string;
}
