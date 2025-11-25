import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupDurableObject, type DurableObjectFixture } from '../setup';

describe('BaseDurableObject Integration Tests', () => {
    let fixture: DurableObjectFixture;

    beforeEach(async () => {
        fixture = await setupDurableObject();
    });

    afterEach(async () => {
        await fixture.mf.dispose();
    });

    describe('Counter Handler', () => {
        it('should get initial count of 0', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-counter');
            const doInstance = fixture.env.TEST_DO.get(id);

            const response = await doInstance.fetch('http://localhost/count');

            expect(response.status).toBe(200);
            const data = await response.json<{ count: number }>();
            expect(data.count).toBe(0);
        });

        it('should increment count', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-counter-inc');
            const doInstance = fixture.env.TEST_DO.get(id);

            const response = await doInstance.fetch('http://localhost/count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ increment: 5 }),
            });

            expect(response.status).toBe(200);
            const data = await response.json<{ count: number }>();
            expect(data.count).toBe(5);

            // Verify persistence
            const getResponse = await doInstance.fetch('http://localhost/count');
            const getData = await getResponse.json<{ count: number }>();
            expect(getData.count).toBe(5);
        });

        it('should delete count', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-counter-del');
            const doInstance = fixture.env.TEST_DO.get(id);

            // First increment
            await doInstance.fetch('http://localhost/count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ increment: 10 }),
            });

            // Then delete
            const deleteResponse = await doInstance.fetch('http://localhost/count', {
                method: 'DELETE',
            });

            expect(deleteResponse.status).toBe(200);
            const deleteData = await deleteResponse.json<{ count: number; reset: boolean }>();
            expect(deleteData.count).toBe(0);
            expect(deleteData.reset).toBe(true);

            // Verify count is reset
            const getResponse = await doInstance.fetch('http://localhost/count');
            const getData = await getResponse.json<{ count: number }>();
            expect(getData.count).toBe(0);
        });
    });

    describe('State Handler', () => {
        it('should get null for non-existent key', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-state-get');
            const doInstance = fixture.env.TEST_DO.get(id);

            const response = await doInstance.fetch('http://localhost/state/my-key');

            expect(response.status).toBe(200);
            const data = await response.json<{ key: string; value: string | null }>();
            expect(data.key).toBe('my-key');
            expect(data.value).toBe(null);
        });

        it('should store and retrieve state', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-state-put');
            const doInstance = fixture.env.TEST_DO.get(id);

            // Store value
            const putResponse = await doInstance.fetch('http://localhost/state/my-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: 'my-value' }),
            });

            expect(putResponse.status).toBe(200);
            const putData = await putResponse.json<{
                key: string;
                value: string;
                stored: boolean;
            }>();
            expect(putData.key).toBe('my-key');
            expect(putData.value).toBe('my-value');
            expect(putData.stored).toBe(true);

            // Retrieve value
            const getResponse = await doInstance.fetch('http://localhost/state/my-key');

            expect(getResponse.status).toBe(200);
            const getData = await getResponse.json<{ key: string; value: string }>();
            expect(getData.key).toBe('my-key');
            expect(getData.value).toBe('my-value');
        });
    });

    describe('Info Handler', () => {
        it('should return durable object info', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-info');
            const doInstance = fixture.env.TEST_DO.get(id);

            const response = await doInstance.fetch('http://localhost/info');

            expect(response.status).toBe(200);
            const data = await response.json<{ id: string; name: string }>();
            expect(data.id).toBeDefined();
            expect(data.name).toBe('Test Durable Object');
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for unknown routes', async () => {
            const id = fixture.env.TEST_DO.idFromName('test-404');
            const doInstance = fixture.env.TEST_DO.get(id);

            const response = await doInstance.fetch('http://localhost/unknown-route');

            expect(response.status).toBe(404);
        });
    });
});
