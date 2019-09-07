import { isSnsMessage, isSqsEvent, SNSMessage, SQSEvent, TypeGuard } from './guards';

/**
 * Unwraps at most a single instance of T from the input, otherwise
 * throws an error.
 * @param input the input to unwrap
 * @param isType the type guard to assert the type of the result
 */
export function unwrapFirst<T>(input: unknown, isType: TypeGuard<T>): T {
  return unwrap(input, isType).next().value;
}

/**
 * Unwraps all instances of T into an array, otherwise throws an error.
 * @param input the input to unwrap
 * @param isType the type guard to assert the type of the result
 */
export function unwrapAll<T>(input: unknown, isType: TypeGuard<T>): T[] {
  const requests: T[] = [];
  const unwrapper = unwrap(input, isType);

  let request = unwrapper.next();
  do {
    requests.push(request.value);
    request = unwrapper.next();
  } while (!request.done);

  return requests;
}

/**
 * Unwraps an unknown event received by the Lambda into an event of the expected
 * type, attempting to remove any metadata attached by SNS and SQS if necessary.
 * Throws any error if it cannot parse the event into the given type.
 * @param input the input to unwrap.
 * @param isType the type guard to assert the type of the result
 */
export function* unwrap<T>(input: unknown, isType: TypeGuard<T>): Generator<T, T, undefined> {

  // If the event is of the given type we can just return it
  if (isType(input)) {
    return input;
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

  if (isSqsEvent(input)) {
    yield* unwrapSqsEvent(input, isType);
  }

  throw new Error('unable to unwrap SQS event into expected type');

}

/**
 * Unwraps an SQS Event, yielding successive objects of type T if possible, throwing
 * an error if not.
 * @param sqsEvent the SQS Event
 * @param isType the type guard to assert the type of the result
 */
function* unwrapSqsEvent<T>(sqsEvent: SQSEvent, isType: TypeGuard<T>): Generator<T, T, undefined> {
  for (const record of sqsEvent.Records) {

    const message = JSON.parse(record.body);

    // Check if the request was sent directly on SQS without SNS
    if (isType(message)) {
      yield message;
    }

    if (!isSnsMessage(message)) {
      throw new Error('unable to unwrap SNS message into expected type');
    }

    yield unwrapSnsMessage(message, isType);
  }

  throw new Error('no records');
}

/**
 * Unwraps an SNS Message and returns the payload if it is of the
 * expected type, T. Otherwise throws an error.
 * @param message the SNS message
 * @param isType the type guard to assert the type of the result
 */
function unwrapSnsMessage<T>(message: SNSMessage, isType: TypeGuard<T>): T {

  const request = JSON.parse(message.Message);

  if (!isType(request)) {
    throw new Error('unable to unwrap event into expected type');
  }

  return request;
}
