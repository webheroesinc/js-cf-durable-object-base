# Contributing to @whi/cf-do-base

Thank you for your interest in contributing! This document provides guidelines and information for developing and testing this library.

## Development Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Typecheck (src, tests and fixtures) and check formatting, as CI does
npm run check
```

## Project Structure

```
.
├── src/                # Source code
│   └── index.ts       # Main exports and BaseDurableObject class
├── lib/               # Compiled JavaScript (generated)
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   ├── fixtures/      # Test Durable Object implementations
│   ├── __mocks__/     # Mock implementations
│   └── setup.ts       # Test utilities
├── docs/              # Generated TypeDoc documentation
└── Makefile           # Build automation
```

## Testing

This library uses **integration testing** to validate functionality in a simulated Cloudflare Workers environment.

### Test Stack

- **Vitest** - Test runner with coverage
- **Miniflare v3** - Local Cloudflare Workers runtime
- **esbuild** - Fast bundler for test fixtures

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### How Tests Work

1. **Build library** - TypeScript compiled to `lib/`
2. **Bundle test fixtures** - Test Durable Objects bundled with esbuild to `tests/fixtures/dist/`
3. **Run tests** - Miniflare loads bundled Durable Objects and executes tests

The integration tests simulate real usage by:
- Creating test Durable Objects that extend `BaseDurableObject`
- Loading them into Miniflare (local Workers runtime)
- Making HTTP requests to the Durable Object and validating responses

### Building Test Fixtures

```bash
npm run build:tests
```

This uses esbuild to bundle the test Durable Objects with the library code.

### Coverage

The test suite achieves 100% code coverage by thoroughly validating all functionality through integration tests that exercise the library exactly as consumers will use it.

## Code Style

```bash
npm run format        # Format code
npm run format:check  # Check formatting
```

We use Prettier for code formatting. Run `npm run format` before committing. `npm install`
points git at `.githooks/`, whose `pre-push` runs `npm run check`.

## Making Changes

### Adding Features

1. Add source code to `src/index.ts`
2. Export from `src/index.ts` if public API
3. Add tests in `tests/unit/` or `tests/integration/`
4. Update type definitions (TypeScript handles this automatically)
5. Run tests to verify

### Modifying BaseDurableObject Behavior

If changing the base class behavior:
1. Update `src/index.ts`
2. Add/update tests in `tests/integration/`
3. Update test fixtures in `tests/fixtures/` if needed
4. Rebuild and test: `npm test`

### Re-exporting Dependencies

If a dependency needs to be available to consumers:
```typescript
// src/index.ts
export { DurableObjectRouter, DurableObjectRouteHandler } from '@whi/cf-routing';
```

This prevents duplicate classes when bundling test fixtures.

## Build Process

### Using Make

The Makefile defines file targets for incremental builds:

```bash
make lib/index.js                                  # Build library
make tests/fixtures/dist/durable-object-test.js   # Build DO test fixture
```

Make only rebuilds when source files change (based on timestamps).

### Using npm scripts

For running commands (not building files):
```bash
npm run build        # Build library
npm run build:tests  # Build test fixtures
npm test            # Run tests
```

**Note:** npm scripts use pre-hooks to automatically build dependencies.

## Troubleshooting

### "Module not found" errors in tests

**Issue:** Miniflare can't resolve imports.

**Solution:** Test fixtures must import from `lib/index.js` (not `@whi/cf-do-base`):
```typescript
// Good
import { BaseDurableObject } from '../../lib/index.js';

// Bad
import { BaseDurableObject } from '@whi/cf-do-base';
```

### Duplicate class errors

**Issue:** esbuild creates duplicate classes when the same module is imported from different sources.

**Solution:** Import shared dependencies from the library itself:
```typescript
// Good
import { BaseDurableObject } from '../../lib/index.js';
import { DurableObjectRouteHandler } from '@whi/cf-routing';

// Bad - may create duplicates if exported from both
import { BaseDurableObject, DurableObjectRouteHandler } from '../../lib/index.js';
import { DurableObjectRouteHandler } from '@whi/cf-routing';
```


## Future Test Improvements

While current test coverage validates core functionality, here are potential enhancements to better test how consumers will use this base class:

### Base Class Behavior Tests
- Test that options are correctly passed through to DurableObjectRouter
- Test inheritance patterns (multiple levels of subclassing)
- Test that protected router property is accessible in subclasses
- Test constructor edge cases (undefined name, undefined options)

### Durable Object Feature Compatibility
Ensure BaseDurableObject doesn't interfere with native Durable Object features:
- Alarm handling (setting/getting alarms while using routing)
- WebSocket connections through the base class
- Access to `this.storage` operations from route handlers
- Access to `this.state.blockConcurrencyWhile()` and other state methods

### Real-World Scenario Tests
Consider adding `tests/scenarios/` for common BaseDurableObject usage:
- Counter Durable Object with increment/decrement routes
- Key-value store with storage operations
- Session store with TTL and cleanup
- Durable Object with both routes AND alarm handling
- Durable Object with custom initialization logic

### Documentation-Driven Testing
- Test all README code examples as actual runnable tests
- Verify every code snippet in documentation actually compiles and works
- Test TypeScript examples with proper type checking
- Ensure copy-pasteable examples always work

These improvements would increase confidence that consumers can extend BaseDurableObject successfully for their use cases.

## Documentation

API documentation is automatically generated from TypeScript source code and JSDoc comments using TypeDoc.

- Documentation is deployed to GitHub Pages when a release is published (see Branches and Releases)
- View live docs at: https://webheroesinc.github.io/js-cf-durable-object-base/
- Generate locally: `npm run docs`

When adding or modifying public APIs:
1. Add JSDoc comments with `@param`, `@returns`, and `@example` tags
2. Use `@category` to organize exports (Classes, Interfaces, Types)
3. Include code examples in `@example` blocks
4. Run `npm run docs` to verify the output

## Branches and Releases

Work goes in pull requests to `develop`. CI runs format, typecheck and tests,
and they must pass to merge. A release is a pull request from `develop` to
`master`; CI fails it if `version` in `package.json` already has a
`v<version>` tag. Bump it with `npm version <x.y.z> --no-git-tag-version`: the
publish workflow creates the tag, and a tag made locally would make it skip
the release.

Merging to `master` runs `.github/workflows/publish.yml`, which stages the
release on npm with trusted publishing, tags it and redeploys the docs.
Nothing is live until a maintainer approves the staged release with 2FA
(`npm stage approve`, or on npmjs.com). Prereleases (`1.0.0-alpha.1`) go out
under the `next` dist-tag. Record each release in `CHANGELOG.md`.

## Submitting Changes

1. Fork the repository
2. Create a feature branch from `develop`
3. Make your changes
4. Add JSDoc comments for any new public APIs
5. Run `npm run check` and `npm test`
6. Add an entry under `[Unreleased]` in `CHANGELOG.md` for user-visible changes
7. Commit with clear messages
8. Submit a pull request to `develop`

## Questions?

Open an issue on GitHub for questions or discussion about contributing.
