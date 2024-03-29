[![npm](https://img.shields.io/npm/v/cachestorage-monitor)](https://www.npmjs.com/package/cachestorage-monitor)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/cachestorage-monitor)
[![build status](https://github.com/lionralfs/cachestorage-monitor/actions/workflows/node.js.yml/badge.svg)](https://github.com/lionralfs/cachestorage-monitor/actions/workflows/node.js.yml)

## What does this do?

This library proxies calls to `read` operations on the [`CacheStorage`](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) interface using [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to automatically detect and record cache hits and misses. The wrapped cache-reading operations are:

- [`CacheStorage.match`](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/match)
- [`Cache.match`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/match)
- [`Cache.matchAll`](https://developer.mozilla.org/en-US/docs/Web/API/Cache/matchAll)

Let's say you're reading `index.html` from cache:

```js
const response = await caches.match('/index.html');
```

Assuming you have the file in your cache, this library would detect the cache hit, and pass you a corresponding event:

```json
{
	"operation": "caches.match",
	"result": "HIT",
	"request": "/index.html",
	"timestamp": 1663430910914
}
```

## Why would I use this?

For analysis mostly. Perhaps you are precaching a set of assets during service worker installation and want to figure out the cache hit rates on these assets. You could then built an automated solution on top of such a system to determine the optimal precache list.

## Installation

```
npm install --save cachestorage-monitor
```

## Usage

The script works both on the main thread and inside service workers and automatically attaches itself to the global object upon importing.

If you're using a bundler, import the script:

```js
import 'cachestorage-monitor';
```

Inside service workers, you could also use `importScripts` (for example, in combination with a CDN):

```js
importScripts('https://unpkg.com/cachestorage-monitor@latest/dist/index.js');
```

You then have access to the global `onCacheTrackerUpdate` function to configure the library. It takes the following arguments:

1. `callback` (`(events: Array<CacheEvent>) => any`)
   - The function that should be called when any cache-reads have been detected. The cache events are then passed as its only argument.
2. `timeout` (`number`)
   - The number of milliseconds to wait before calling callback. Passing a higher number here causes the events to be batched together more which potentially results in less but larger updates.

### Example

This service worker example sends cache events in batches to a custom HTTP telemetry endpoint:

```js
import 'cachestorage-monitor';

onCacheTrackerUpdate((events) => {
	fetch('/telemetry', {
		method: 'POST',
		keepalive: true,
		body: JSON.stringify(events), // adjust as necessary
	});
}, 15_000); // batch by 15 seconds (only fires if any events occurs)

// ... rest of your service worker code ...
```

## License

[MIT](LICENSE) © Lion Ralfs
