# SNS/SQS Unwrap
Utility package for unwrapping events from SNS/SQS.

It is a common architectural pattern when using AWS to send requests to different services via an SQS queue rather than sending them directly to the service. This additional layer ensures that if the service is busy then it does not get overloaded with additional traffic and if it is down then the requests do not get lost. This is often paired with SNS to form a pub/sub model, with one service publishing a request on SNS and the SQS queue of another subscribing to that SNS topic.

The consequence of this is that the actual request to your service gets stringified and wrapped with additional metadata. This package provides utility functions which attempt to unwrap an object of `unknown` type from any metadata and assert that the resulting object is of the expected type.

## Usage
### unwrap

### unwrapAll

### unwrapFirst