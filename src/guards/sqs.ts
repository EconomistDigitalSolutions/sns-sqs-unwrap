import { isArray, IsInterface, isString } from "generic-type-guard";

export interface SQSRecord {
  body: string;
}

/**
 * Type guard for SQSRecords
 */
export const isSqsRecord =
  new IsInterface()
    .withProperties({
      body: isString,
    })
    .get();

export interface SQSEvent {
  Records: SQSRecord[];
}

/**
 * Type guard for SQSEvents
 */
export const isSqsEvent =
  new IsInterface()
    .withProperties({
      Records: isArray(isSqsRecord),
    })
    .get();
