import { test, expect } from '@playwright/test';
import {
	collectSWMessages,
	waitForActiveSW,
	withinTime,
} from '../helpers/index.js';

test.describe('Integration: A Service worker with Caches.match', () => {
	test('Tracks cache hits', async ({ page }) => {
		await page.goto('/test/static/?swFile=sw-caches-match');
		await waitForActiveSW(page);

		const before = Date.now();
		const status = await page.evaluate(() => {
			return fetch('/').then((resp) => resp.status);
		});
		const swMessages = await collectSWMessages(page);

		expect(status).toBe(200);
		expect(swMessages).toMatchObject([
			[
				{
					operation: 'caches.match',
					result: 'HIT',
					request: 'GET http://localhost:3000/', // was serialized
				},
			],
		]);
		withinTime(swMessages[0][0].timestamp, before, Date.now());
	});

	test('Tracks cache hits (using a string as argument to caches.match)', async ({
		page,
	}) => {
		await page.goto('/test/static/?swFile=sw-caches-match');
		await waitForActiveSW(page);

		const before = Date.now();
		const status = await page.evaluate(() => {
			return fetch('/use-string').then((resp) => resp.status);
		});
		const swMessages = await collectSWMessages(page);

		expect(status).toBe(200);
		expect(swMessages).toMatchObject([
			[
				{
					operation: 'caches.match',
					result: 'HIT',
					request: '/',
				},
			],
		]);
		withinTime(swMessages[0][0].timestamp, before, Date.now());
	});

	test('Tracks cache misses', async ({ page }) => {
		await page.goto('/test/static/?swFile=sw-caches-match');
		await waitForActiveSW(page);

		const before = Date.now();
		const status = await page.evaluate(() => {
			return fetch('/does-not-exist.html').then((resp) => resp.status);
		});
		const swMessages = await collectSWMessages(page);

		expect(status).toBe(404);
		expect(swMessages).toMatchObject([
			[
				{
					operation: 'caches.match',
					result: 'MISS',
					request: 'GET http://localhost:3000/does-not-exist.html',
				},
			],
		]);
		withinTime(swMessages[0][0].timestamp, before, Date.now());
	});

	test('Tracks cache misses (using a string as argument to caches.match)', async ({
		page,
	}) => {
		await page.goto('/test/static/?swFile=sw-caches-match');
		await waitForActiveSW(page);

		const before = Date.now();
		const status = await page.evaluate(() => {
			return fetch('/use-string-nonexistent').then((resp) => resp.status);
		});
		const swMessages = await collectSWMessages(page);

		expect(status).toBe(404);
		expect(swMessages).toMatchObject([
			[
				{
					operation: 'caches.match',
					result: 'MISS',
					request: '/does-not-exist.html',
				},
			],
		]);
		withinTime(swMessages[0][0].timestamp, before, Date.now());
	});
});
