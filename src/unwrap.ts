import { TypeGuard } from 'generic-type-guard';
import { isSnsMessage, isSqsEvent } from './guards';

export interface UnwrapOptions {
  debug: boolean;
}

const defaults: UnwrapOptions = {
  debug: false,
};

/**
 * Unwraps an unknown event received by the Lambda into an event of the expected
 * type, attempting to remove any metadata attached by SNS and SQS if necessary.
 * Throws any error if it cannot parse the event into the given type.
 * @param event the event to unwrap.
 */
export function* unwrap<T>(event: unknown, isType: TypeGuard<T>, opts: UnwrapOptions = defaults): Generator<T, T, undefined> {

  // If the event is of the given type we can just return it
  if (isType(event)) {
    return event;
  }

  /**
   * The event isn't directly the type we want but it may have been sent
   * via SNS/SQS which means will have to try and unwrap it.
   *
   * The expectation is that the underlying request will be stringified and
   * passed as the `Message` parameter of a JSON object published to SNS. This
   * object will itself be stringified and passed as the `body` parameter on an
   * SQS Record. An SQS Event will contain an array of these records, so we can
   * check each in turn, yielding them as requested.
   */

  if (!isSqsEvent(event)) {
    throw new Error('unable to unwrap SQS event into expected type');
  }

  for (const record of event.Records) {

    const message = JSON.parse(record.body);

    // Check if the request was sent directly on SQS without SNS
    if (isType(message)) {
      yield message;
    }

    if (!isSnsMessage(message)) {
      throw new Error('unable to unwrap SNS message into expected type');
    }

    const request = JSON.parse(message.Message);

    if (!isType(request)) {
      throw new Error('unable to unwrap event into expected type');
    }

    yield request;
  }

  throw new Error('no records');
}

export function unwrapFirst<T>(event: unknown, isType: TypeGuard<T>): T {
  return unwrap(event, isType).next().value;
}

export function unwrapAll<T>(event: unknown, isType: TypeGuard<T>): T[] {
  const requests: T[] = [];
  const unwrapper = unwrap(event, isType);

  let request = unwrapper.next();
  do {
    requests.push(request.value);
    request = unwrapper.next();
  } while (!request.done);

  return requests;
}
