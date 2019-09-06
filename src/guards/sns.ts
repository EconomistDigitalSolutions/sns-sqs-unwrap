import { IsInterface, isString } from "generic-type-guard";

/**
 * Type guard for SNSMessages
 */
export const isSnsMessage =
  new IsInterface()
    .withProperties({
      Message: isString,
    })
    .get();
