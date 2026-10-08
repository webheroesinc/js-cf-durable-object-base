# Changelog

All notable changes to `@whi/cf-do-base` will be documented in this file.
Releases up to 0.3.0 predate it; see the git tags.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

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
