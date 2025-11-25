/// <reference types="@cloudflare/workers-types" />

import { BaseDurableObject } from '../../lib/index.js';
import { DurableObjectRouteHandler, HttpError } from '@whi/cf-routing';

export interface Env {
    LOG_LEVEL: string;
    TEST_DO: DurableObjectNamespace;
}

// Example route handler for counter
class CounterHandler extends DurableObjectRouteHandler<Env> {
    async get(request: Request): Promise<any> {
        const count = (await this.ctx.storage.get<number>('count')) || 0;
        return { count };
    }

    async post(request: Request): Promise<any> {
        const body = await request.json<{ increment?: number }>();
        const currentCount = (await this.ctx.storage.get<number>('count')) || 0;
        const newCount = currentCount + (body.increment || 1);
        await this.ctx.storage.put('count', newCount);
        return { count: newCount };
    }

    async delete(request: Request): Promise<any> {
        await this.ctx.storage.delete('count');
        return { count: 0, reset: true };
    }
}

// Example handler with state parameters
class StateHandler extends DurableObjectRouteHandler<Env, { key: string }> {
    async get(request: Request, params?: { key: string }): Promise<any> {
        if (!params?.key) {
            throw new HttpError(400, 'Key is required');
        }
        const value = await this.ctx.storage.get<string>(params.key);
        return { key: params.key, value: value || null };
    }

    async put(request: Request, params?: { key: string }): Promise<any> {
        if (!params?.key) {
            throw new HttpError(400, 'Key is required');
        }
        const body = await request.json<{ value: string }>();
        await this.ctx.storage.put(params.key, body.value);
        return { key: params.key, value: body.value, stored: true };
    }
}

// Info handler
class InfoHandler extends DurableObjectRouteHandler<Env> {
    async get(request: Request): Promise<any> {
        return {
            id: this.ctx.id.toString(),
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
