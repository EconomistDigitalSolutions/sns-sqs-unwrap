import { isArray, IsInterface, isString } from "generic-type-guard";

/**
 * Type guard for SQSRecords
 */
export const isSqsRecord =
  new IsInterface()
    .withProperties({
      body: isString,
    })
    .get();

/**
 * Type guard for SQSEvents
 */
export const isSqsEvent =
  new IsInterface()
    .withProperties({
      Records: isArray(isSqsRecord),
    })
    .get();
