import { test, expect } from '@playwright/test';
import { withinTime as expectWithinTime } from '../helpers/index.js';

test.describe('Integration: Outside of a service worker (the main page)', () => {
	test('Skips timeout when page visiblity changes', async ({ page }) => {
		await page.goto(`/test/static/page?timeoutMs=${1_000 * 60 * 60 * 24}`);
		await page.waitForFunction(() => window.__ready === true);
		const before = Date.now();
		await page.evaluate(() => {
			return caches.match('/');
		});
		// cause the visibilitychange event to fire
		await page.reload();
		const events1 = await page.evaluate(() =>
			JSON.parse(window.localStorage.getItem('call-1')),
		);
		const events2 = await page.evaluate(() =>
			JSON.parse(window.localStorage.getItem('call-2')),
		);

		expect(events1).toMatchObject([
			{ operation: 'caches.match', result: 'MISS', request: '/' },
		]);
		expectWithinTime(events1[0].timestamp, before, Date.now());
		expect(events2).toBeNull();
	});

	test('Works when timeout is reached + using batching', async ({ page }) => {
		await page.goto(`/test/static/page?timeoutMs=${1_000}`);
		await page.waitForFunction(() => window.__ready === true);
		const before = Date.now();
		await page.evaluate(() => {
			return Promise.all([
				caches.match('/'),
				caches
					.open('test-cache')
					.then((cache) => cache.matchAll('/test', { ignoreSearch: true })),
			]);
		});

		await page.waitForTimeout(1000);
		const events1 = await page.evaluate(() =>
			JSON.parse(window.localStorage.getItem('call-1')),
		);
		const events2 = await page.evaluate(() =>
			JSON.parse(window.localStorage.getItem('call-2')),
		);

		expect(events1).toMatchObject([
			{ operation: 'caches.match', result: 'MISS', request: '/' },
			{
				operation: 'cache.matchAll',
				resultCount: 0,
				result: 'MISS',
				request: '/test',
			},
		]);
		expectWithinTime(events1[0].timestamp, before, Date.now());
		expectWithinTime(events1[1].timestamp, before, Date.now());
		expect(events2).toBeNull();
	});
});
