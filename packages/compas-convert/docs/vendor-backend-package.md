# Including the vendored backend package

We have an internally synced backend package providing various features to our backends.
This guide is meant to integrate these features in the project itself before the
compas-convert runs.

## Steps

1. Investigate which features of the backend package are used. You can immediately drop
   the unused features.
2. Determine how big of a refactor you are going to do;
   - Only stripping of unused features
   - Moving the package more in to the project sources, but keeping the structure as is.
   - Integrating the package provided features fully in to the code-base.
3. Execute the steps below accordingly. For review purposes, make sure to split things up
   in separate commits and/or PR's.

### Stripping features

Removing an any component mostly means:

- Removing the subdirectory and its uses in various calls like `authCreateUser`.
  - Naming is decently consistent, so search for `passwordLogin` and `passwordBased` for
    example, should net all usages of the password based login provider.
- Removing related database columns and tables in a new migration. Verify cascade deletes!
- Some features include a specific dependency like `speakeasy` for TOTP tokens. It is
  advised to verify unnecessary dependencies after stripping of all features.

Some tips:

- When removing totp, also include the `otp*` fields on `passwordLogin`. You might be able
  to remove the `twoStep` functionality completely.
- Some callbacks like `determineTwoStepFunction` and `combineUserCallbacks` can be removed
  completely if unused.

### Moving the package

- Combine the package.json dependencies. Remove `workspaces` from the root package.json
- Move the README.md from the vendored package in its source directory
- Copy the contents of the vendored `src` directory to `src/backend`
- Update all imports of `@lightbase/backend`. Verify all the workings

### Other cleanups

- Remove usages of `importProjectResource`. Add explicit project imports in places where
  this is used.
- Using `typeof import(` is used a bunch in this project. However, while removing the
  `importProjectResource` calls, you added a bunch of imports in various places, so you
  can update `typeof import(` into `typeof authController` for example.
