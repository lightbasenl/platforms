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

- Remove usages 'services' in the `services.js` file. Add explicit project imports in
  places where these are used. Most of these can be replaced with either direct imports
  from generated code, or services available in the project. After this,you should be able
  to remove `importProjectResources`.
- Cleanup the exports from `backend/index.js` as much as possible. This might be necessary
  to get code-gen working again. For example, code-gen structure files can't depend on
  generator output.
- Sentry metrics support has been removed. Remove any usages of `Sentry.metrics` or
  `_compasSentryExport?.metrics`
- Replace `(ctx, next)` callbacks with `(ctx)`. `next` was supported for backwards
  compatibility reasons. Note that raw Koa callbacks, e.g `app.use` still need to use the
  `next` parameter.
