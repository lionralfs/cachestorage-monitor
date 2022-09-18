import makeServiceWorkerEnv from 'service-worker-mock';
import sinon from 'sinon';
import fs from 'fs';
import vm from 'vm';
import { expect } from '@playwright/test';

const libSource = fs.readFileSync('./src/index.js', 'utf-8');

async function addDummyDataToCache() {
	const cache = await caches.open('test-cache');
	await cache.put('test.html', new Response('<h1>test</h1>'));
	await cache.put('/', new Response('<h1>slash</h1>'));
	await cache.put('/?foo=bar', new Response('<h1>slash-with-search</h1>'));
}

async function clearCaches() {
	const cacheNames = await caches.keys();
	await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
}

export async function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createFakeSWEnv() {
	const cachesMatchFake = sinon.stub();
	const cacheMatchAllFake = sinon.stub();
	const cacheMatchFake = sinon.stub();

	const cachesOpenFake = sinon.stub().returns(
		Promise.resolve({
			matchAll: cacheMatchAllFake,
			match: cacheMatchFake,
		}),
	);

	// create mocked service worker environment with stubbed cache methods
	const swEnv = Object.assign({}, makeServiceWorkerEnv(), {
		caches: {
			open: cachesOpenFake,
			match: cachesMatchFake,
		},
		performance: {
			now: sinon.stub(performance, 'now').callsFake(() => 12345),
			timeOrigin: 1659887685430,
		},
		setTimeout: sinon.stub().callsFake((fn) => fn()),
		clearTimeout: sinon.stub(),
	});

	// needs to be done after sw env has been created, because node doesn't know `Response`
	cacheMatchAllFake.returns(
		Promise.resolve([new swEnv.Response(), new swEnv.Response()]),
	);

	// import actual library code (modifies global scope)
	vm.runInNewContext(libSource, swEnv);

	return {
		env: swEnv,
		'caches.open': cachesOpenFake,
		'caches.match': cachesMatchFake,
		'cache.match': cacheMatchFake,
		'cache.matchAll': cacheMatchAllFake,
	};
}

export async function waitForActiveSW(page) {
	// await a promise that resolves when the page is controlled.
	await page.evaluate(async () => {
		await new Promise((resolve) => {
			if (navigator.serviceWorker.controller) {
				// If we're already controlled, resolve immediately.
				resolve();
			} else {
				// Otherwise, resolve after controllerchange fires.
				navigator.serviceWorker.addEventListener('controllerchange', () =>
					resolve(),
				);
			}
		});
	});

	// set up a global array to collect events in
	await page.evaluate(() => {
		window.__swMessages = [];
		navigator.serviceWorker.onmessage = (events) => {
			window.__swMessages.push(events.data);
		};
	});
}

export async function collectSWMessages(page) {
	await page.waitForFunction(() => window.__swMessages.length > 0);
	return page.evaluate(() => window.__swMessages);
}

export function withinTime(timestamp, t1, t2) {
	expect(timestamp).toBeLessThan(t2);
	expect(timestamp).toBeGreaterThan(t1);
}
