import sinon from 'sinon';
import { expect } from 'chai';
import { createFakeSWEnv } from '../helpers/index.js';

describe('The CacheStorage.match method', () => {
	const onTrack = sinon.stub();
	const expectedTimestamp = 1659887685430 + 12345;

	let matchFake;
	let swEnv;

	beforeEach(() => {
		const { env, ...stubs } = createFakeSWEnv();
		swEnv = env;
		matchFake = stubs['caches.match'];

		swEnv.onCacheTrackerUpdate(onTrack, 1);
	});

	afterEach(() => {
		sinon.restore();
		onTrack.reset();
	});

	it('Tracks cache hits', async () => {
		// Given
		const fakeResponse = new swEnv.Response();
		matchFake.returns(Promise.resolve(fakeResponse));

		// When
		const response = await swEnv.caches.match('test.html');

		// Then
		expect(response).to.be.deep.equal(fakeResponse);
		expect(matchFake.calledOnceWithExactly('test.html')).to.be.true;
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'caches.match',
					result: 'HIT',
					request: 'test.html',
					timestamp: expectedTimestamp,
				},
			],
		]);
	});

	it('Tracks cache misses', async () => {
		// Given
		matchFake.returns(Promise.resolve(undefined));

		// When
		const response = await swEnv.caches.match('doesnotexist.html');

		// Then
		expect(response).to.be.equal(undefined);
		expect(matchFake.calledOnceWithExactly('doesnotexist.html')).to.be.true;
		expect(onTrack.calledOnce).to.be.true;
		expect(onTrack.getCall(0).args).to.deep.equal([
			[
				{
					operation: 'caches.match',
					result: 'MISS',
					request: 'doesnotexist.html',
					timestamp: expectedTimestamp,
				},
			],
		]);
	});
});
