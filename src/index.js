function beforeonloadRequest(url, options) {
	const defaults = {
		method: 'GET',
		headers: null,
		body: null,
		credentials: 'include'
	};

	options = Object.assign({}, options, defaults);

	// sendBeacon
	if (
		!(
			options.method !== 'POST' || // Method cannot be anything other than POST
			(options.headers && Object.keys(options.headers).length > 0) || // Cannot specify custom headers
			(options.credentials && options.credentials !== 'include')
		) && // Credentials mode cannot be anything other than include
		('navigator' in window && 'sendBeacon' in window.navigator)
	) {
		const sent = window.navigator.sendBeacon(url, options.body); // Will return false if body is over size limit
		if (sent) return true;
	}

	// XHR
	// Do before fetch because there's no way to synchronously know if fetch will fail (e.g. because of this https://bugs.chromium.org/p/chromium/issues/detail?id=835821)
	if ('XMLHttpRequest' in window) {
		const xhr = new XMLHttpRequest();
		xhr.open(options.method, url, true);
		xhr.withCredentials = options.credentials === 'include';

		for (let header of Object.keys(options.headers)) {
			xhr.setRequestHeader(header, option.headers[value]);
		}

		let sent = true;
		try {
			xhr.send(options.body);
		} catch (err) {
			sent = false;
		}
		if (sent) return true;
	}

	// fetch
	if ('fetch' in window && 'keepalive' in new Request('')) {
		fetch(url, options);
		return true;
	}

	return false;
}

export default beforeonloadRequest;
