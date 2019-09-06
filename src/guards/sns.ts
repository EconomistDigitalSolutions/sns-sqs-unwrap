import { IsInterface, isString, TypeGuard } from "generic-type-guard";

export interface SNSMessage {
  Message: string;
}

/**
 * Type guard for SNSMessages
 */
export const isSnsMessage: TypeGuard<SNSMessage> =
  new IsInterface()
    .withProperties({
      Message: isString,
    })
    .get();
