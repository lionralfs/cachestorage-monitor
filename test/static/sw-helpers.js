/**
 * In order to send the events back to the page via `postMessage`, all `Request` objects have to be serialized
 */
function serialize(events) {
	return events.map((event) => ({
		...event,
		request:
			typeof event.request === 'string'
				? event.request
				: `${event.request.method || 'GET'} ${event.request.url}`,
	}));
}
