/// <reference types="@cloudflare/workers-types" />

import { Miniflare } from 'miniflare';

// Resolve paths relative to this file without Node's path/url modules, whose types
// would clash with the Workers types the tests are checked against
const resolve = (relative: string) => new URL(relative, import.meta.url).pathname;

export interface DurableObjectTestEnv {
    LOG_LEVEL: string;
    TEST_DO: DurableObjectNamespace;
}

export interface DurableObjectFixture {
    mf: Miniflare;
    env: DurableObjectTestEnv;
}

export async function setupDurableObject(): Promise<DurableObjectFixture> {
    const mf = new Miniflare({
        modules: true,
        scriptPath: resolve('fixtures/dist/durable-object-test.js'),
        bindings: {
            LOG_LEVEL: 'fatal',
        },
        durableObjects: {
            TEST_DO: 'TestDurableObject',
        },
        modulesRoot: resolve('..'),
    });

    const TEST_DO = (await mf.getDurableObjectNamespace(
        'TEST_DO'
    )) as unknown as DurableObjectNamespace;

    return {
        mf,
        env: {
            LOG_LEVEL: 'fatal',
            TEST_DO,
        },
    };
}
