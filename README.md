# Cloudflare Durable Object Base Class

[![License: LGPL-3.0](https://img.shields.io/badge/License-LGPL--3.0-blue.svg?style=flat-square)](https://www.gnu.org/licenses/lgpl-3.0)
[![npm version](https://img.shields.io/npm/v/@whi/cf-do-base.svg?style=flat-square)](https://www.npmjs.com/package/@whi/cf-do-base)

Base class for Cloudflare Durable Objects with built-in routing support using [@whi/cf-routing](https://github.com/webheroesinc/js-cf-routing).

## Features

- **Simple Inheritance** - Extend `BaseDurableObject` instead of `DurableObject`
- **Automatic Router Setup** - Router is initialized and ready to use
- **Class-based Route Handlers** - Organize routes using ES6 classes
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
import { DurableObjectRouteHandler } from '@whi/cf-routing';

class CounterHandler extends DurableObjectRouteHandler {
    async get() {
        const count = (await this.ctx.storage.get('count')) || 0;
        return { count };
    }

    async post() {
        const count = ((await this.ctx.storage.get('count')) || 0) + 1;
        await this.ctx.storage.put('count', count);
        return { count };
    }
}

export class Counter extends BaseDurableObject {
    constructor(ctx, env) {
        super(ctx, env, 'counter');
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
    constructor(ctx, env) {
        // Name your Durable Object for better logging
        super(ctx, env, 'my-durable-object');

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
class DataHandler extends DurableObjectRouteHandler {
    async get() {
        const data = await this.ctx.storage.get('data');
        return { data };
    }

    async post(request) {
        const body = await request.json();
        await this.ctx.storage.put('data', body.data);
        return { success: true };
    }

    async delete() {
        await this.ctx.storage.delete('data');
        return { deleted: true };
    }
}

export class DataStore extends BaseDurableObject {
    constructor(ctx, env) {
        super(ctx, env, 'data-store');
        this.router.defineRouteHandler('/data', DataHandler);
    }
}
```

### Custom Router Configuration

Pass custom configuration to the underlying itty-router:

```typescript
export class ApiDurableObject extends BaseDurableObject {
    constructor(ctx, env) {
        // Pass router options as the fourth parameter
        super(ctx, env, 'api', { base: '/api/v1' });

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
    constructor(ctx: DurableObjectState, env: MyEnv) {
        super(ctx, env, 'my-do');

        // env is fully typed
        const apiKey = this.env.API_KEY;
    }
}
```

### Middleware Support

Use the router's middleware capabilities:

```typescript
import { HttpError } from '@whi/cf-routing';

export class SecureDO extends BaseDurableObject {
    constructor(ctx, env) {
        super(ctx, env, 'secure');

        // Add authentication middleware
        this.router.all('/api/*', async (request, params) => {
            const token = request.headers.get('Authorization');
            if (!token) {
                throw new HttpError(401, 'Unauthorized');
            }
        });

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
