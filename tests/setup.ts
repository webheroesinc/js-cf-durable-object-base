/// <reference types="@cloudflare/workers-types" />

import { Miniflare } from 'miniflare';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        scriptPath: path.join(__dirname, 'fixtures/dist/durable-object-test.js'),
        bindings: {
            LOG_LEVEL: 'fatal',
        },
        durableObjects: {
            TEST_DO: 'TestDurableObject',
        },
        modulesRoot: path.join(__dirname, '..'),
    });

    const TEST_DO = (await mf.getDurableObjectNamespace('TEST_DO')) as unknown as DurableObjectNamespace;

    return {
        mf,
        env: {
            LOG_LEVEL: 'fatal',
            TEST_DO,
        },
    };
}
