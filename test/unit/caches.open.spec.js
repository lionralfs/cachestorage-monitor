import { expect } from 'chai';
import { createFakeSWEnv } from '../helpers/index.js';

describe('The CacheStorage.open method', () => {
	let swEnv;
	let cachesOpenFake;

	beforeEach(() => {
		const { env, ...stubs } = createFakeSWEnv();
		swEnv = env;
		cachesOpenFake = stubs['caches.open'];
	});

	it('Forwards the cache opening operation', async () => {
		// When
		const cache = await swEnv.caches.open('v1');

		// Then
		expect(cachesOpenFake.calledOnceWithExactly('v1')).to.be.true;
	});
});
