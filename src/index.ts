/**
 * @packageDocumentation
 * Base class for Cloudflare Durable Objects with built-in routing support.
 *
 * This package provides a convenient base class that extends Cloudflare's DurableObject
 * with automatic routing capabilities using {@link https://github.com/webheroesinc/js-cf-routing | @whi/cf-routing}.
 *
 * @example
 * ```typescript
 * import { BaseDurableObject } from '@whi/cf-do-base';
 * import { DurableObjectRouteHandler } from '@whi/cf-routing';
 *
 * class CounterHandler extends DurableObjectRouteHandler {
 *   async get() {
 *     const count = await this.ctx.storage.get('count') || 0;
 *     return { count };
 *   }
 * }
 *
 * export class Counter extends BaseDurableObject {
 *   constructor(ctx, env) {
 *     super(ctx, env, 'counter');
 *     this.router.defineRouteHandler('/count', CounterHandler);
 *   }
 * }
 * ```
 */

/// <reference types="@cloudflare/workers-types" />

import { DurableObject } from 'cloudflare:workers';

import { DurableObjectRouter } from '@whi/cf-routing';
import type { Router } from 'itty-router';

/**
 * Base environment interface for Cloudflare Workers
 *
 * Extend this interface with your own environment bindings:
 *
 * @example
 * ```typescript
 * interface MyEnv extends Env {
 *   DB: D1Database;
 *   MY_KV: KVNamespace;
 * }
 * ```
 */
export interface Env {
    /** Logging level for the router (e.g., 'debug', 'info', 'warn', 'error', 'fatal') */
    LOG_LEVEL: string;
}

/**
 * Base class for Durable Objects with built-in routing capabilities
 *
 * This class extends Cloudflare's DurableObject and automatically initializes
 * a DurableObjectRouter instance. Subclasses can define routes in their constructor
 * using the `this.router` property.
 *
 * @typeParam E - Environment type extending base Env interface
 *
 * @category Classes
 *
 * @example
 * Basic usage with route handlers
 * ```typescript
 * import { BaseDurableObject } from '@whi/cf-do-base';
 * import { DurableObjectRouteHandler } from '@whi/cf-routing';
 *
 * class MessageHandler extends DurableObjectRouteHandler {
 *   async post(request) {
 *     const { message } = await request.json();
 *     await this.ctx.storage.put('message', message);
 *     return { success: true };
 *   }
 * }
 *
 * export class MessageStore extends BaseDurableObject {
 *   constructor(ctx, env) {
 *     super(ctx, env, 'message-store');
 *     this.router.defineRouteHandler('/message', MessageHandler);
 *   }
 * }
 * ```
 *
 * @example
 * With custom router configuration
 * ```typescript
 * export class CustomDO extends BaseDurableObject {
 *   constructor(ctx, env) {
 *     super(ctx, env, 'custom', { base: '/api' });
 *     this.router.defineRouteHandler('/health', HealthHandler);
 *   }
 * }
 * ```
 */
export class BaseDurableObject<E extends Env> extends DurableObject<E> {
    /** The DurableObjectRouter instance handling all requests */
    protected router!: DurableObjectRouter<E>;

    /**
     * Create a new BaseDurableObject instance
     *
     * @param ctx - Durable Object state provided by Cloudflare
     * @param env - Environment bindings containing KV namespaces, secrets, etc.
     * @param name - Optional name for the router (used in logging). Defaults to 'unnamed'
     * @param router_args - Optional arguments passed to the underlying itty-router instance
     *
     * @example
     * ```typescript
     * constructor(ctx, env) {
     *   super(ctx, env, 'my-durable-object');
     * }
     * ```
     */
    constructor(
        ctx: DurableObjectState,
        env: E,
        protected name?: string,
        router_args?: Parameters<typeof Router>
    ) {
        super(ctx, env);

        this.router = new DurableObjectRouter(
            this.ctx,
            this.env,
            name ?? 'unnamed',
            ...(router_args ?? [])
        );
    }

    /**
     * Handle incoming requests
     *
     * This method is called by Cloudflare for each HTTP request to the Durable Object.
     * It delegates all request handling to the router.
     *
     * @param request - The incoming HTTP request
     * @returns A Promise resolving to the HTTP response
     *
     * @example
     * The fetch method is automatically called by Cloudflare Workers.
     * You typically don't need to override this unless you need custom
     * request preprocessing:
     * ```typescript
     * async fetch(request: Request): Promise<Response> {
     *   // Custom preprocessing
     *   console.log('Received request:', request.url);
     *
     *   // Delegate to router
     *   return super.fetch(request);
     * }
     * ```
     */
    async fetch(request: Request): Promise<Response> {
        return this.router.handle(request);
    }
}
