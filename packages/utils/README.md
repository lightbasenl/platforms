# @lightbase/utils

Various utilities, some lodash like, some to aid with strict TypeScript. Also includes
various type utilities.

## Utilities

This library exports the utility functions in the following groups:

## Assertion functions

Type-narrowing assertions, that throw when the provided value is falsy. This uses
TypeScript assert operator.

### `assertIsNil`

Asserts that the provided value is `null` or `undefined`. Else throws the provided error.

### `assertNotNil`

Asserts that the provided value is **not** `null` or `undefined. Else throws the provided
error.

## 'Is' functions

Type-narrowing functions, returning truthy when the value is of the corresponding type.
These can be used to constrain type in if-else branches.

### `isNil`

Returns `true` when the provided value is `null` or `undefined`.

### `isRecord`

Returns `true` when the provided value is an object-like.

### `isRecordWith`

Returns `true` when the provided value is an object-like and has the provided keys.

## Invariants

Generic assertion functions that don't type-narrow. Can be used to create
business-specific validation functions to align business logic and related error return
types.

> [!INFO]
>
> If at some point TypeScript supports creating assertion functions via a generic
> function, without manually typing the resulting assertion, this system will be applied
> to asserts as well.

### `createInvariant`

Create an invariant function to execute business rules. Various options are supported:

- A predicate callback which is executed to determine if an invariant fails
- Various options for error customization:
  - Static error messages.
  - Customizable error messages on invariant invocation.
  - A custom error constructor, function or static method with typed arguments on
    invariant invocation.
  - Partial application of the provided custom error.

## Types

This library exports the following utility types:

### `Prettify`

Force TypeScript to resolve the result of computed types. Can be used to improve the
readability in Quick-documentation popups and errors.

### `MaybePromise` and `MaybeArray`

Represent a value which may be wrapped in a `Promise` or `Array` respectively.

### `ExtractPromise` and `ExtractArray`

Extract the type wrapped in a `MaybePromise` or `MaybeArray` respectively.

### `Brand`

Brand types, so a general type like string is not assignable to a business constrainted
type like 'email' without going through an explicit cast. See the
[Zod](https://zod.dev/?id=brand) docs or the
[Total TypeScript article](https://www.totaltypescript.com/four-essential-typescript-patterns)
on this subject.

### `PickKeysThatExtends` and `OmitKeysThatExtend`

Like `Pick` and `Omit`, but instead of specifying keys, specify the type of value that
should be picked or omitted.

### `UnionToIntersection`

Map union types to an intersection type.

### `InferFunctionLikeParameters`

Extract the parameter types from class constructors or functions.

## Node.js

This package has a specific `@encapsula/util/node` export providing the following
utilities

### `createAsyncLocalStorage`

Wrapper around
[AsyncLocalStorage](https://nodejs.org/api/async_context.html#class-asynclocalstorage),
for read-only AsyncLocalStorage use. The main difference is the explicit `get` and
`getOptional` functions that wrap `AsyncLocalStorage#getStore`. `get`, throws an error
when not in the async-context of a store.
