import * as t from "io-ts";
import { unwrap, unwrapAll, unwrapGenerator } from "../unwrap";

const MyInput = t.type({
  foo: t.string,
  bar: t.number,
  baz: t.boolean,
});

type MyInput = t.TypeOf<typeof MyInput>;

const isMyInput = MyInput.is;

describe('unwrap.ts', () => {

  let input: unknown;

  beforeEach(() => {
    input = {
      foo: 'foo',
      bar: 0,
      baz: false,
    };
  });

  describe('unwrapGenerator', () => {

    it('unwraps the input when it is of the expected type', () => {
      try {
        const result = unwrapGenerator(input, isMyInput).next().value;
        expect(result).toEqual(input);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the input when it comes directly from SQS', () => {
      const unwrappedInput = input;
      input = wrapForSqs(input);
      try {
        const result = unwrapGenerator(input, isMyInput).next().value;
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('unwraps and yields successive inputs when they comes directly from SQS', () => {
      const unwrappedInput = input;
      input = wrapForSqs(input);
      try {
        const unwrapper = unwrapGenerator(input, isMyInput).next();
        const result = unwrapper.value;
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the input when it comes from SNS via SQS', () => {
      const unwrappedInput = input;
      input = wrapForSns(input);
      try {
        const result = unwrapGenerator(input, isMyInput).next().value;
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('throws an error when the input is not the expected type or an SQS Event', () => {
      input = {};
      try {
        unwrapGenerator(input, isMyInput).next();
        fail();
      } catch (err) {
        expect(err.message).toBe('Unable to unwrap the provided event.');
      }
    });

    it('throws an error when the input is an SQS Event with no Records', () => {
      input = wrapForSqs(input);
      (input as any).Records = [];
      try {
        unwrapGenerator(input, isMyInput).next();
        fail();
      } catch (err) {
        expect(err.message).toBe('No Records provided on the event.');
      }
    });

    it('throws an error when an SQS Record is not the expected type or an SNS Message', () => {
      input = wrapForSqs({});
      try {
        unwrapGenerator(input, isMyInput).next();
        fail();
      } catch (err) {
        expect(err.message).toBe('Unable to unwrap the SQS payload.');
      }
    });

    it('throws an error when the SNS Message payload is not the expected type', () => {
      input = wrapForSns({});
      try {
        unwrapGenerator(input, isMyInput).next();
        fail();
      } catch (err) {
        expect(err.message).toBe('Unable to unwrap the SNS payload into the expected type.');
      }
    });
  });

  describe('unwrapAll', () => {

    it('unwraps the input to an array of the expected type when it is of the expected type', () => {
      try {
        const result = unwrapAll(input, isMyInput);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(input);
      } catch (err) {
        fail();
      }
    });

    it('throws an error when the input cannot be unwrapped', () => {
      input = {};
      try {
        unwrapAll(input, isMyInput);
        fail();
      } catch (err) {
        expect(err.message).toBe('Unable to unwrap the provided event.');
      }
    });
  });

  describe('unwrap', () => {
    it('unwraps the first input when it is of the expected type', () => {
      try {
        const result = unwrap(input, isMyInput);
        expect(result).toEqual(input);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the first input when it comes directly from SQS', () => {
      const unwrappedInput = input;
      input = wrapForSqs(input);
      try {
        const result = unwrap(input, isMyInput);
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the first input when it comes from SNS via SQS', () => {
      const unwrappedInput = input;
      input = wrapForSns(input);
      try {
        const result = unwrap(input, isMyInput);
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });
  });
});

function wrapForSqs(input: unknown) {
  return {
    Records: [{
      body: JSON.stringify(input),
    }],
  };
}

function wrapForSns(input: unknown) {
  return wrapForSqs({
    Message: JSON.stringify(input),
  });
}
