((env) => {
	let updateUser = () => {};
	let delay;
	env.onCacheTrackerUpdate = (cb, msDelay = 15_000) => {
		updateUser = cb;
		delay = msDelay;
	};

	env.document?.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			sendUpdate();
		}
	});

	let timeout;
	let events = [];
	function onTrack(cacheEvent) {
		events.push(cacheEvent);
		timeout = setTimeout(sendUpdate, delay);
	}

	function sendUpdate() {
		clearTimeout(timeout);
		if (events.length === 0) return;
		let eventsCopy = [...events];
		updateUser(eventsCopy);
		events = [];
	}

	const matchHandler = {
		async apply(_, __, args) {
			const [request] = args || [];
			const result = await Reflect.apply(...arguments);
			const now = performance.now();

			onTrack({
				operation: 'caches.match',
				result: result === undefined ? 'MISS' : 'HIT',
				request: request,
				timestamp: performance.timeOrigin + now,
			});
			return result;
		},
	};

	const openHandler = {
		async apply(_, __, args) {
			const cache = await Reflect.apply(...arguments);

			cache.match = new Proxy(cache.match, {
				async apply(_, __, args) {
					const [request] = args || [];
					const result = await Reflect.apply(...arguments);
					const now = performance.now();

					onTrack({
						operation: 'cache.match',
						result: result === undefined ? 'MISS' : 'HIT',
						request: request,
						timestamp: performance.timeOrigin + now,
					});

					return result;
				},
			});

			cache.matchAll = new Proxy(cache.matchAll, {
				async apply(_, __, args) {
					const [request] = args || [];
					const result = await Reflect.apply(...arguments);
					const now = performance.now();

					onTrack({
						operation: 'cache.matchAll',
						result: result.length === 0 ? 'MISS' : 'HIT',
						resultCount: result.length,
						request: request,
						timestamp: performance.timeOrigin + now,
					});

					return result;
				},
			});

			return cache;
		},
	};

	env.caches.match = new Proxy(env.caches.match, matchHandler);
	env.caches.open = new Proxy(env.caches.open, openHandler);
})(globalThis);
