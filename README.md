# Cloudflare Durable Object Base Class

[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg?style=flat-square)](https://www.gnu.org/licenses/lgpl-3.0)
[![npm version](https://img.shields.io/npm/v/@whi/cf-do-base.svg?style=flat-square)](https://www.npmjs.com/package/@whi/cf-do-base)

Base class for Cloudflare Durable Objects with built-in routing support using [@whi/cf-routing](https://github.com/webheroesinc/js-cf-routing).

## Features

- **Simple Inheritance** - Extend `BaseDurableObject` instead of `DurableObject`
- **Automatic Router Setup** - Router is initialized and ready to use
- **Class-based Route Handlers** - Organize routes using ES6 classes
- **Context Object** - `ctx` argument with request, params, and data; `this` provides storage access
- **Built-in Error Handling** - Automatic JSON error responses with proper status codes
- **Type Safety** - Full TypeScript support with generic types
- **Zero Boilerplate** - Focus on your business logic, not routing setup

## Installation

```bash
npm install @whi/cf-do-base
```

## Quick Start

### Basic Durable Object with Routing

```typescript
import { BaseDurableObject } from '@whi/cf-do-base';
import { DurableObjectRouteHandler, DurableObjectContext } from '@whi/cf-routing';

class CounterHandler extends DurableObjectRouteHandler {
    async get(ctx: DurableObjectContext) {
        const count = (await this.storage.get('count')) || 0;
        return { count };
    }

    async post(ctx: DurableObjectContext) {
        const count = ((await this.storage.get('count')) || 0) + 1;
        await this.storage.put('count', count);
        return { count };
    }
}

export class Counter extends BaseDurableObject {
    constructor(state, env) {
        super(state, env, 'counter');
        this.router.defineRouteHandler('/count', CounterHandler);
    }
}
```

### Wrangler Configuration

```toml
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"
script_name = "my-worker"

[[migrations]]
tag = "v1"
new_classes = ["Counter"]
```

## Key Features

### Extending BaseDurableObject

The base class handles all the router initialization for you:

```typescript
import { BaseDurableObject } from '@whi/cf-do-base';

export class MyDurableObject extends BaseDurableObject {
    constructor(state, env) {
        // Name your Durable Object for better logging
        super(state, env, 'my-durable-object');

        // Router is ready to use
        this.router.defineRouteHandler('/users', UserHandler);
        this.router.defineRouteHandler('/posts/:id', PostHandler);
    }

    // fetch() is already implemented - it delegates to the router
}
```

### Route Handlers with Multiple HTTP Methods

Create route handlers by implementing multiple HTTP methods in a single class:

```typescript
import { DurableObjectRouteHandler, DurableObjectContext } from '@whi/cf-routing';

class DataHandler extends DurableObjectRouteHandler {
    async get(ctx: DurableObjectContext) {
        const data = await this.storage.get('data');
        return { data };
    }

    async post(ctx: DurableObjectContext) {
        const body = await ctx.request.json();
        await this.storage.put('data', body.data);
        return { success: true };
    }

    async delete(ctx: DurableObjectContext) {
        await this.storage.delete('data');
        return { deleted: true };
    }
}

export class DataStore extends BaseDurableObject {
    constructor(state, env) {
        super(state, env, 'data-store');
        this.router.defineRouteHandler('/data', DataHandler);
    }
}
```

The `ctx` object contains per-request data:
- `ctx.request` - The incoming Request
- `ctx.params` - Route parameters (e.g., `{ id: '123' }`)
- `ctx.data` - Shared data for middleware communication
- `ctx.response` - Response customization (status, headers)
- `ctx.log` - Logger instance

The handler's `this` provides Durable Object instance access:
- `this.storage` - Durable Object storage
- `this.id` - Durable Object ID
- `this.state` - Raw DurableObjectState
- `this.env` - Environment bindings

### CORS Configuration

Pass CORS configuration to the router:

```typescript
export class ApiDurableObject extends BaseDurableObject {
    constructor(state, env) {
        // Pass router options as the fourth parameter
        super(state, env, 'api', { cors: { origins: '*' } });

        this.router.defineRouteHandler('/users', UserHandler);
    }
}
```

### Environment Type Safety

Use TypeScript generics for type-safe environment access:

```typescript
import { BaseDurableObject, Env } from '@whi/cf-do-base';

interface MyEnv extends Env {
    DB: D1Database;
    MY_KV: KVNamespace;
    API_KEY: string;
}

export class MyDO extends BaseDurableObject<MyEnv> {
    constructor(state: DurableObjectState, env: MyEnv) {
        super(state, env, 'my-do');

        // env is fully typed
        const apiKey = this.env.API_KEY;
    }
}
```

### Middleware Support

Use the router's middleware capabilities with the next() pattern:

```typescript
import { HttpError, DurableObjectMiddleware } from '@whi/cf-routing';

export class SecureDO extends BaseDurableObject {
    constructor(state, env) {
        super(state, env, 'secure');

        // Add authentication middleware
        // Middleware receives (ctx, state, next) - state is the DurableObjectState
        const authMiddleware: DurableObjectMiddleware = async (ctx, state, next) => {
            const token = ctx.request.headers.get('Authorization');
            if (!token) {
                throw new HttpError(401, 'Unauthorized');
            }
            ctx.data.authenticated = true;
            return next();
        };

        this.router.use('/api/*', authMiddleware);
        this.router.defineRouteHandler('/api/data', DataHandler);
    }
}
```

## Documentation

**https://webheroesinc.github.io/js-cf-durable-object-base/**

API documentation is automatically generated from source code using TypeDoc and deployed on every push to master.

To generate locally:

```bash
npm run docs         # Generate documentation in docs/
npm run docs:watch   # Generate docs in watch mode
```

## Advanced Routing

For advanced routing features, middleware, error handling, and more details on route handlers, see the [@whi/cf-routing documentation](https://webheroesinc.github.io/js-cf-routing/).

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, testing, and contribution guidelines.

### Running Tests

```bash
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # With coverage report
```

### Building

```bash
npm run build            # Build TypeScript to lib/
npm run format           # Format code with Prettier
```

## License

LGPL-3.0

## Credits

Built on top of [@whi/cf-routing](https://github.com/webheroesinc/js-cf-routing) - Class-based routing framework for Cloudflare Workers.
