[![CI](https://github.com/lionralfs/cachestorage-monitor/actions/workflows/node.js.yml/badge.svg)](https://github.com/lionralfs/cachestorage-monitor/actions/workflows/node.js.yml)

## title?

- cachestorage-tracker
- caches-tracker
- sw-caches-hitrate

## todos / to think about

- What happens when user calls `onCacheTrackerUpdate` with different cb function or delay?
- What happens when used outside of service worker and page is closed/navigated away from?
  - --> visibilitychange event listener (implemented, needs tests)
- What about timestamps?
  - --> performance.now (implemented, tested)

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

## License

[MIT](LICENSE) © Lion Ralfs
