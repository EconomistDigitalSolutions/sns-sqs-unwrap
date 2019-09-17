import * as t from "io-ts";

const SNSMessage = t.type({
  Message: t.string,
});

export type SNSMessage = t.TypeOf<typeof SNSMessage>;

export const isSnsMessage = SNSMessage.is;
