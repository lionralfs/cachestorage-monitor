import sinon from 'sinon';
import { expect } from 'chai';
import { createFakeSWEnv } from '../helpers/index.js';

describe('The Cache.match method', () => {
	const onTrack = sinon.stub();
	const expectedTimestamp = 1659887685430 + 12345;

	let matchFake;
	let cachesOpenFake;
	let swEnv;

	beforeEach(() => {
		const { env, ...stubs } = createFakeSWEnv();
		swEnv = env;
		matchFake = stubs['cache.match'];
		cachesOpenFake = stubs['caches.open'];

		swEnv.onCacheTrackerUpdate(onTrack, 1);
	});

	afterEach(() => {
		sinon.restore();
		onTrack.reset();
	});

	it('Tracks cache hits', async () => {
		// Given
		const fakeResponse = new swEnv.Response();
		const cache = await swEnv.caches.open('test-cache');
		matchFake.returns(Promise.resolve(fakeResponse));

		// When
		const response = await cache.match('test.html');

		// Then
		expect(response).to.deep.equal(fakeResponse);
		expect(cachesOpenFake.calledOnce).to.be.true;
		expect(cachesOpenFake.getCall(0).args).to.deep.equal(['test-cache']);
		expect(matchFake.calledOnce).to.be.true;
		expect(matchFake.getCall(0).args).to.deep.equal(['test.html']);
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'cache.match',
					result: 'HIT',
					request: 'test.html',
					timestamp: expectedTimestamp,
				},
			],
		]);
	});

	it('Tracks cache misses', async () => {
		// Given
		const cache = await swEnv.caches.open('test-cache');
		matchFake.returns(Promise.resolve(undefined));

		// When
		const response = await cache.match('doesnotexist.html');

		// Then
		expect(response).to.deep.equal(undefined);
		expect(cachesOpenFake.calledOnce).to.be.true;
		expect(cachesOpenFake.getCall(0).args).to.deep.equal(['test-cache']);
		expect(matchFake.calledOnce).to.be.true;
		expect(matchFake.getCall(0).args).to.deep.equal(['doesnotexist.html']);
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'cache.match',
					result: 'MISS',
					request: 'doesnotexist.html',
					timestamp: expectedTimestamp,
				},
			],
		]);
	});
});
