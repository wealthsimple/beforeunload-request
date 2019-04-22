function beforeonloadRequest(url, initialOptions) {
	const defaults = {
		method: 'POST',
		headers: null,
		body: null,
		credentials: 'include'
	};

	const options = Object.assign({}, defaults, initialOptions);
	options.headers = options.headers || {};

	function trySendBeacon() {
		if (!('navigator' in window && 'sendBeacon' in window.navigator)) {
			return false; // Need sendBeacon to be available
		}

		if (options.method !== 'POST') {
			return false; // Method cannot be anything other than POST
		}

		if (options.credentials && options.credentials !== 'include') {
			return false; // Credentials mode cannot be anything other than include
		}

		if (
			Object.keys(options.headers).length >
			('Content-Type' in options.headers ? 1 : 0)
		) {
			return false; // Cannot specify header other than Content-Type
		}

		let body = options.body;
		if ('Content-Type' in options.headers) {
			// If Content-Type is specified, try to wrap body in Blob so we can use the Content-Type

			if (!('Blob' in window)) {
				return false; // Need Blob to be available
			}

			if (typeof options.body !== 'string') {
				return false; // Body needs to be a string
			}

			body = new Blob([options.body], {
				type: options.headers['Content-Type']
			});
		}

		try {
			return window.navigator.sendBeacon(url, body); // Will return false if body is over size limit
		} catch (err) {
			// One example of such an error https://bugs.chromium.org/p/chromium/issues/detail?id=490015
			return false;
		}
	}

	function tryXHR() {
		const xhr = new XMLHttpRequest();
		xhr.open(options.method, url, false);
		xhr.withCredentials = options.credentials === 'include';

		for (let header of Object.keys(options.headers)) {
			xhr.setRequestHeader(header, options.headers[header]);
		}

		try {
			xhr.send(options.body);
		} catch (err) {
			// Browser likely not allowing syhnchronous XHR https://bugs.chromium.org/p/chromium/issues/detail?id=952452
			return false;
		}

		return true;
	}

	function tryFetch() {
		if (!('fetch' in window)) {
			// Need fetch to be available
			return false;
		}

		if (!('keepalive' in new Request(''))) {
			// Need Request to support keepalive
			return false;
		}

		fetch(url, Object.assign({}, options, { keepalive: true }));
		return true;
	}

	if (trySendBeacon()) {
		return true;
	}

	if (tryXHR()) {
		// Do before fetch because there's no way to synchronously know if fetch will fail (e.g. because of this https://bugs.chromium.org/p/chromium/issues/detail?id=835821)
		return true;
	}

	if (tryFetch()) {
		return true;
	}

	return false;
}

export default beforeonloadRequest;
