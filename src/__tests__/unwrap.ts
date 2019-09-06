import { isBoolean, IsInterface, isNumber, isString, TypeGuard } from "generic-type-guard";
import { unwrap } from "../unwrap";

interface MyEvent {
  foo: string;
  bar: number;
  baz: boolean;
}

const isMyEvent: TypeGuard<MyEvent> =
  new IsInterface()
    .withProperties({
      foo: isString,
      bar: isNumber,
      baz: isBoolean,
    })
    .get();

describe('unwrap', () => {

  let event: unknown;

  beforeEach(() => {
    event = {
      foo: 'foo',
      bar: 0,
      baz: false,
    };
  });

  it('unwraps the event when it is of the expected type', () => {
    try {
      const result = unwrap(event, isMyEvent).next().value;
      expect(result).toBe(event);
    } catch (err) {
      fail();
    }
  });

  it('unwraps the event when it comes directly from SQS', () => {
    fail();
  });

  it('unwraps the event when it comes from SNS via SQS', () => {
    fail();
  });

});

describe('unwrapAll', () => {
  it('unwraps the event to an array of the expected type when it is of the expected type', () => {
    fail();
  });
});

describe('unwrapFirst', () => {
  it('unwraps the first event when it is of the expected type', () => {
    fail();
  });

  it('unwraps the first event when it comes directly from SQS', () => {
    fail();
  });

  it('unwraps the first event when it comes from SNS via SQS', () => {
    fail();
  });
});
