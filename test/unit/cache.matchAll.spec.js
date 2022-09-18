import sinon from 'sinon';
import { expect } from 'chai';
import { createFakeSWEnv } from '../helpers/index.js';

describe('The Cache.matchAll method', () => {
	const onTrack = sinon.stub();
	const expectedTimestamp = 1659887685430 + 12345;

	let matchAllFake;
	let cachesOpenFake;
	let swEnv;

	beforeEach(() => {
		const { env, ...stubs } = createFakeSWEnv();
		swEnv = env;
		matchAllFake = stubs['cache.matchAll'];
		cachesOpenFake = stubs['caches.open'];

		swEnv.onCacheTrackerUpdate(onTrack, 1);
	});

	afterEach(() => {
		sinon.restore();
		onTrack.reset();
	});

	it('Tracks multiple cache hits', async () => {
		// Given
		const cache = await swEnv.caches.open('test-cache');

		// When
		const response = await cache.matchAll('/', {
			ignoreSearch: true,
		});

		// Then
		expect(cachesOpenFake.calledOnce).to.be.true;
		expect(cachesOpenFake.getCall(0).args).to.deep.equal(['test-cache']);
		expect(matchAllFake.calledOnce).to.be.true;
		expect(matchAllFake.getCall(0).args).to.deep.equal([
			'/',
			{ ignoreSearch: true },
		]);
		expect(response.length).to.be.equal(2);
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'cache.matchAll',
					result: 'HIT',
					resultCount: 2,
					request: '/',
					timestamp: expectedTimestamp,
				},
			],
		]);
	});

	it('Works without arguments (matches all)', async () => {
		// Given
		const cache = await swEnv.caches.open('test-cache');

		// When
		const response = await cache.matchAll();

		// Then
		expect(cachesOpenFake.calledOnce).to.be.true;
		expect(cachesOpenFake.getCall(0).args).to.deep.equal(['test-cache']);
		expect(matchAllFake.calledOnce).to.be.true;
		expect(matchAllFake.getCall(0).args).to.deep.equal([]);
		expect(response.length).to.be.equal(2);
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'cache.matchAll',
					result: 'HIT',
					resultCount: 2,
					request: undefined,
					timestamp: expectedTimestamp,
				},
			],
		]);
	});

	it('Tracks cache misses', async () => {
		// Given
		const cache = await swEnv.caches.open('test-cache');
		matchAllFake.returns(Promise.resolve([]));

		// When
		const response = await cache.matchAll();

		// Then
		expect(response.length).to.be.equal(0);
		expect(cachesOpenFake.calledOnce).to.be.true;
		expect(cachesOpenFake.getCall(0).args).to.deep.equal(['test-cache']);
		expect(matchAllFake.calledOnce).to.be.true;
		expect(matchAllFake.getCall(0).args).to.deep.equal([]);
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'cache.matchAll',
					result: 'MISS',
					resultCount: 0,
					request: undefined,
					timestamp: expectedTimestamp,
				},
			],
		]);
	});
});
