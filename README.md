![CircleCI](https://img.shields.io/circleci/build/github/EconomistDigitalSolutions/sns-sqs-unwrap)
![Codecov](https://img.shields.io/codecov/c/github/EconomistDigitalSolutions/sns-sqs-unwrap)

# SNS/SQS Unwrap
Utility package for unwrapping Lambda events from SNS/SQS.

## Overview
It is a common architectural pattern when using AWS to send requests to different services via an SQS queue rather than sending them directly to the service. This additional layer ensures that if the service is busy then it does not get overloaded with additional traffic and if it is down then the requests do not get lost. This is often paired with SNS to form a pub/sub model, with one service publishing a request on SNS and the SQS queue of another subscribing to that SNS topic.

The consequence of this is that the event received by your Lambda contains a stringified version of the original request wrapped with additional metadata. This package provides utility functions which attempt to unwrap an object of `unknown` type from any metadata and assert that the resulting object is of the expected type. These functions will also "short-circuit" if the input at any point can be inferred to be of type `T`. This allows for easier debugging by being able to send "pure" requests directly to your Lambdas rather than having to manually wrap them or send the via SNS/SQS.

## Usage
### unwrap
```typescript
function unwrap<T>(input: unknown, isType: (value: unknown) => value is T): T
```
Unwraps the first instance of type `T` that can be found on the provided input. 

Throws an error if no instances of type `T` are found or the input cannot be unwrapped correctly.

If there is more than one `Record` in the provided input then a most a single instance of `T` is unwrapped and the remaining `Records` are discarded.

### unwrapAll
```typescript
function unwrapAll<T>(input: unknown, isType: (value: unknown) => value is T): T[]
```
Unwraps all instances of type `T` that can be found on the provided input into an array. 

Throws an error if no instances of type `T` are found, the input cannot be unwrapped correctly or ***any*** of the unwrapped objects are not of type `T`.

If you need to be able to ignore individual errors from unwrapping (e.g. if a single `Record` out of many cannot be unwrapped into an instance of `T`) then use [unwrapGenerator](#unwrapgenerator).

### unwrapGenerator
```typescript
function* unwrapGenerator<T>(input: unknown, isType: (value: unknown) => value is T): Generator<T, T, undefined>
```
Returns a generator that can be used to progressively unwrap `Records` on an input into instances of type `T`.

#### Example
```typescript
import { unwrapGenerator } from 'sns-sqs-unwrap';

const unwrapper = unwrapGenerator(input, isT);

const result: T = unwrapper.next().value;
```

## Example
Suppose you define the structure of a request to your Lambda to be:
```typescript
interface MyRequest {
  id: number;
  data: string;
  flag: boolean;
}
```
and an actual request:
```json
{
  "id": 123,
  "data": "some data",
  "flag": true
}
```
When this is sent via SNS it will be stringified and wrapped with metadata resulting in something like:
```json
{
  "Type": "Notification",
  "MessageId": "...",
  "TopicArn": "...",
  "Message": "{\"id\":123,\"data\":\"some data\",\"flag\":true}",
  "Timestamp": "1970-01-01T00:00:00.000Z",
  "SignatureVersion": "1",
  "Signature": "...",
  "SigningCertURL": "...",
  "UnsubscribeURL": "..."
}
```
This then gets stringified again and wrapped with additional metadata by SQS:
```json
{
  "body": "{\"Type\":\"Notification\",\"MessageId\":\"...\",\"TopicArn\":\"...\",\"Message\":\"{\\\"id\\\":123,\\\"data\\\":\\\"some data\\\",\\\"flag\\\":true}\",\"Timestamp\":\"1970-01-01T00:00:00.000Z\",\"SignatureVersion\":\"1\",\"Signature\":\"...\",\"SigningCertURL\":\"...\",\"UnsubscribeURL\":\"...\"}",
  "receiptHandle": "...",
  "md5OfBody": "...",
  "eventSourceARN": "...",
  "eventSource": "aws:sqs",
  "awsRegion": "...",
  "messageId": "...",
  "attributes": {
    "ApproximateFirstReceiveTimestamp": "0",
    "SenderId": "...",
    "ApproximateReceiveCount": "1",
    "SentTimestamp": "0"
  },
  "messageAttributes": {}
}
```
This is then included in an array of `Records` when sent to your Lambda (based on the batch sized configured on the Lambda):
```json
{
  "Records": [
    {
      "body": "{\"Type\":\"Notification\",\"MessageId\":\"...\",\"TopicArn\":\"...\",\"Message\":\"{\\\"id\\\":123,\\\"data\\\":\\\"some data\\\",\\\"flag\\\":true}\",\"Timestamp\":\"1970-01-01T00:00:00.000Z\",\"SignatureVersion\":\"1\",\"Signature\":\"...\",\"SigningCertURL\":\"...\",\"UnsubscribeURL\":\"...\"}",
      "receiptHandle": "...",
      "md5OfBody": "...",
      "eventSourceARN": "...",
      "eventSource": "aws:sqs",
      "awsRegion": "...",
      "messageId": "...",
      "attributes": {
        "ApproximateFirstReceiveTimestamp": "0",
        "SenderId": "...",
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "0"
      },
      "messageAttributes": {}
    }
  ]
}
```
This event can then be unwrapped as such:
```typescript
import { unwrap } from 'sns-sqs-unwrap';

const request: MyRequest = unwrap(event, isMyRequest);
```