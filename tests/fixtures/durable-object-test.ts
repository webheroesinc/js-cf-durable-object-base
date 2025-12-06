/// <reference types="@cloudflare/workers-types" />

import { BaseDurableObject } from '../../lib/index.js';
import { DurableObjectRouteHandler, DurableObjectContext, HttpError } from '@whi/cf-routing';

export interface Env {
    LOG_LEVEL: string;
    TEST_DO: DurableObjectNamespace;
}

// Example route handler for counter
class CounterHandler extends DurableObjectRouteHandler<Env> {
    async get(ctx: DurableObjectContext): Promise<any> {
        const count = (await this.storage.get<number>('count')) || 0;
        return { count };
    }

    async post(ctx: DurableObjectContext): Promise<any> {
        const body = await ctx.request.json<{ increment?: number }>();
        const currentCount = (await this.storage.get<number>('count')) || 0;
        const newCount = currentCount + (body.increment || 1);
        await this.storage.put('count', newCount);
        return { count: newCount };
    }

    async delete(ctx: DurableObjectContext): Promise<any> {
        await this.storage.delete('count');
        return { count: 0, reset: true };
    }
}

// Example handler with state parameters
class StateHandler extends DurableObjectRouteHandler<Env, { key: string }> {
    async get(ctx: DurableObjectContext<{ key: string }>): Promise<any> {
        if (!ctx.params?.key) {
            throw new HttpError(400, 'Key is required');
        }
        const value = await this.storage.get<string>(ctx.params.key);
        return { key: ctx.params.key, value: value || null };
    }

    async put(ctx: DurableObjectContext<{ key: string }>): Promise<any> {
        if (!ctx.params?.key) {
            throw new HttpError(400, 'Key is required');
        }
        const body = await ctx.request.json<{ value: string }>();
        await this.storage.put(ctx.params.key, body.value);
        return { key: ctx.params.key, value: body.value, stored: true };
    }
}

// Info handler
class InfoHandler extends DurableObjectRouteHandler<Env> {
    async get(ctx: DurableObjectContext): Promise<any> {
        return {
            id: this.id.toString(),
            name: 'Test Durable Object',
        };
    }
}

// Test Durable Object using BaseDurableObject
export class TestDurableObject extends BaseDurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env, 'test-do');

        // Register route handlers
        this.router.defineRouteHandler('/count', CounterHandler);
        this.router.defineRouteHandler('/state/:key', StateHandler);
        this.router.defineRouteHandler('/info', InfoHandler);
    }
}

// Worker that creates and routes to Durable Object
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Get or create a TestDurableObject instance
        const id = env.TEST_DO.idFromName('test-instance');
        const doInstance = env.TEST_DO.get(id);

        // Forward request to the Durable Object
        return doInstance.fetch(request);
    },
};
