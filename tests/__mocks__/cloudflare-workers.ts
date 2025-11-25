/// <reference types="@cloudflare/workers-types" />

/**
 * Mock implementation of Cloudflare's DurableObject base class for testing
 */
export class DurableObject<Env = any, Props = any> {
    protected ctx: DurableObjectState<Props>;
    protected env: Env;

    constructor(ctx: DurableObjectState, env: Env) {
        this.ctx = ctx;
        this.env = env;
    }

    async fetch?(request: Request): Promise<Response> {
        return new Response('Not implemented', { status: 501 });
    }
}
