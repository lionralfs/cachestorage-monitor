importScripts('/dist/index.js');
importScripts('/test/static/sw-helpers.js');

self.addEventListener('install', (event) => {
	self.skipWaiting();

	onCacheTrackerUpdate((events) => {
		self.clients.matchAll().then((clients) => {
			clients.forEach((client) => client.postMessage(serialize(events)));
		});
	}, 0);

	async function populateCache() {
		const cache = await caches.open('test-cache');
		cache.put('/', new Response('test-body'));
		cache.put('/?search=test', new Response('test-body-with-search'));
	}

	event.waitUntil(populateCache());
});

self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
	if (event.request.mode === 'navigate') {
		return;
	}

	event.respondWith(
		(async () => {
			switch (new URL(event.request.url).pathname) {
				case '/use-string': {
					const cachedResponse = await caches.match('/');
					if (cachedResponse) return cachedResponse;
					return new Response('not found', { status: 404 });
				}
				case '/use-string-nonexistent': {
					const cachedResponse = await caches.match('/does-not-exist.html');
					if (cachedResponse) return cachedResponse;
					return new Response('not found', { status: 404 });
				}
				default: {
					const cachedResponse = await caches.match(event.request);
					if (cachedResponse) return cachedResponse;
					return new Response('not found', { status: 404 });
				}
			}
		})(),
	);
});
