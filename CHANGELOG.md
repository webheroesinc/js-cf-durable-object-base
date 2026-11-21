# Changelog

All notable changes to `@whi/cf-do-base` will be documented in this file.
Releases up to 0.3.0 predate it; see the git tags.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- `@whi/cf-routing` is updated to 0.9.0. Cookies a handler or middleware sets
  on `ctx.response.headers` are now sent even when the request then fails (for
  example clearing a session cookie before throwing a 401), and an `HttpError`
  can carry several cookies: pass its headers as an array of name-value pairs
  or a `Headers` object. `HttpError.headers` is now typed as `HeadersInit`, so
  code that reads it with `err.headers['X-Foo']` needs a cast or
  `new Headers(err.headers).get('X-Foo')`. See the
  [`@whi/cf-routing` changelog](https://github.com/webheroesinc/js-cf-routing/blob/master/CHANGELOG.md#090---2026-11-20).
- If your project also depends on `@whi/cf-routing` directly (for example to
  import `HttpError` or the handler types), update it to 0.9 as well. With a
  separate 0.8 copy, an `HttpError` you throw isn't recognised by this
  package's router, so the request gets a 500 instead of the error's own
  status.

## [0.4.0] - 2026-10-08

### Changed

- Requires `@whi/cf-routing` `^0.8.0` (was `^0.6.0`), which changes request
  handling inside your Durable Objects:
  - Middleware also runs on CORS preflight (`OPTIONS`) requests (0.7.0).
  - Route parameters are percent-decoded before reaching middleware and
    handlers, and a malformed escape gets a 400 before any middleware runs
    (0.8.0). Code that already decodes `ctx.params` itself now decodes twice
    and should stop.

  See the [@whi/cf-routing changelog](https://github.com/webheroesinc/js-cf-routing/blob/master/CHANGELOG.md).

### Fixed

- The `options` constructor parameter carries the Durable Object's env type, so
  a dynamic CORS `origins` callback can read its env bindings with their types.
