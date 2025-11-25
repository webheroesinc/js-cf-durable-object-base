import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseDurableObject } from '../../src/index';

interface TestEnv {
    LOG_LEVEL: string;
}

// Mock DurableObjectState
const createMockState = (): DurableObjectState => ({
    id: {
        toString: () => 'test-id',
        equals: () => false,
        name: 'test-name',
    } as DurableObjectId,
    storage: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        deleteAll: vi.fn(),
        list: vi.fn(),
        getAlarm: vi.fn(),
        setAlarm: vi.fn(),
        deleteAlarm: vi.fn(),
        sync: vi.fn(),
        transaction: vi.fn(),
        transactionSync: vi.fn(),
        getSql: vi.fn(),
    } as any,
    blockConcurrencyWhile: vi.fn(async (callback: () => Promise<void>) => callback()),
    waitUntil: vi.fn(),
    abort: vi.fn(),
});

describe('BaseDurableObject', () => {
    let mockState: DurableObjectState;
    let mockEnv: TestEnv;

    beforeEach(() => {
        mockState = createMockState();
        mockEnv = { LOG_LEVEL: 'fatal' };
    });

    it('should create instance with default name', () => {
        const doInstance = new BaseDurableObject(mockState, mockEnv);
        expect(doInstance).toBeDefined();
        expect(doInstance['router']).toBeDefined();
    });

    it('should create instance with custom name', () => {
        const doInstance = new BaseDurableObject(mockState, mockEnv, 'custom-name');
        expect(doInstance).toBeDefined();
        expect(doInstance['router']).toBeDefined();
    });

    it('should expose ctx and env properties', () => {
        const doInstance = new BaseDurableObject(mockState, mockEnv, 'test');

        expect(doInstance['ctx']).toBe(mockState);
        expect(doInstance['env']).toBe(mockEnv);
    });

    it('should have a fetch method', () => {
        const doInstance = new BaseDurableObject(mockState, mockEnv, 'test');
        expect(doInstance.fetch).toBeDefined();
        expect(typeof doInstance.fetch).toBe('function');
    });

    it('should delegate fetch to router', async () => {
        const doInstance = new BaseDurableObject(mockState, mockEnv, 'test');

        // Mock the router.handle method
        const mockResponse = new Response('test response');
        vi.spyOn(doInstance['router'], 'handle').mockResolvedValue(mockResponse);

        const request = new Request('https://example.com/test');
        const response = await doInstance.fetch(request);

        expect(doInstance['router'].handle).toHaveBeenCalledWith(request);
        expect(response).toBe(mockResponse);
    });
});
