import { isBoolean, IsInterface, isNumber, isString, TypeGuard } from "generic-type-guard";
import { unwrap, unwrapAll, unwrapFirst } from "../unwrap";

interface MyInput {
  foo: string;
  bar: number;
  baz: boolean;
}

const isMyInput: TypeGuard<MyInput> =
  new IsInterface()
    .withProperties({
      foo: isString,
      bar: isNumber,
      baz: isBoolean,
    })
    .get();

describe('unwrap.ts', () => {

  let input: unknown;

  beforeEach(() => {
    input = {
      foo: 'foo',
      bar: 0,
      baz: false,
    };
  });

  describe('unwrap', () => {

    it('unwraps the input when it is of the expected type', () => {
      try {
        const result = unwrap(input, isMyInput).next().value;
        expect(result).toEqual(input);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the input when it comes directly from SQS', () => {
      const unwrappedInput = input;
      input = wrapForSqs(input);
      try {
        const result = unwrap(input, isMyInput).next().value;
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the input when it comes from SNS via SQS', () => {
      const unwrappedInput = input;
      input = wrapForSns(input);
      try {
        const result = unwrap(input, isMyInput).next().value;
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
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
        console.error(err);
      }
    });
  });

  describe('unwrapFirst', () => {
    it('unwraps the first input when it is of the expected type', () => {
      try {
        const result = unwrapFirst(input, isMyInput);
        expect(result).toEqual(input);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the first input when it comes directly from SQS', () => {
      const unwrappedInput = input;
      input = wrapForSqs(input);
      try {
        const result = unwrapFirst(input, isMyInput);
        expect(result).toEqual(unwrappedInput);
      } catch (err) {
        fail();
      }
    });

    it('unwraps the first input when it comes from SNS via SQS', () => {
      const unwrappedInput = input;
      input = wrapForSns(input);
      try {
        const result = unwrapFirst(input, isMyInput);
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
