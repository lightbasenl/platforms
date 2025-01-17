# Create a utils package

## Context

At some point it is bound to happen that we maintain 10 versions of `isNil` in this repo
and countless more in private projects. I’m currently on five implementations and
counting. So we need a place to put this stuff, the so-called 'utils'.

There are a few main problems often cited for these kinds of packages:

- Unclear rules of what is a util and what isn't.
- Hard to discover what exists in the utils package, often lacking documentation or
  necessary context.

I have few arguments to counter the above. And don't really want to add any 'rules' on
what this package may contain. Which, unsurprisingly, results in the above.

## Decision

We are going to create, publish and maintain a `@lightbase/utils` package. This will
contain:

- Functional utilities and type-safety helpers like `isNil`, `isRecord`, `isRecordwith`,
  `assertNotNil` etc.
- Common generic types like `UnionToIntersection`, `MaybePromise`, etc.

## Consequences

At some point in the future, we might want to add clear rules on what is and isn't a
utility that should be in this package. Until then, authors and reviewers should use
careful consideration before adding things.
