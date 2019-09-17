import * as t from "io-ts";

const SQSRecord = t.type({
  body: t.string,
});

export type SQSRecord = t.TypeOf<typeof SQSRecord>;

export const isSqsRecord = SQSRecord.is;

const SQSEvent = t.type({
  Records: t.array(SQSRecord),
});

export type SQSEvent = t.TypeOf<typeof SQSEvent>;

export const isSqsEvent = SQSEvent.is;
