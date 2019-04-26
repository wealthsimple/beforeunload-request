# beforeunload-request

A unified API to reliably send data on `beforeunload`.

## Why

There is often a need to send data to a server before a page is closed. Asynchronous XHR requests aren't guaranteed to be sent in such a scenario, so traditionally developers have used synchronous XHR requests. However, due to the poor user experience that synchronous XHR requests on `beforeunload` cause, [browsers have started disallowing them](https://bugs.chromium.org/p/chromium/issues/detail?id=952452). There are alternatives to synchronous XHR ([`navigator.sendBeacon`](https://www.w3.org/TR/beacon/) and [`fetch`](https://fetch.spec.whatwg.org/) with [`keepalive`](https://fetch.spec.whatwg.org/#request-keepalive-flag)), but these new APIs have their own set of quirks and [browser](https://bugs.chromium.org/p/chromium/issues/detail?id=835821) [issues](https://bugs.chromium.org/p/chromium/issues/detail?id=490015).

This library unifies all available methods into a single API that prevents common pitfalls (see [Methodology](#methodoloy)).

## Installation

```
$ npm install beforeunload-request
```

## Usage

```
import beforeunloadRequest from 'beforeunload-request';

const success = beforeunloadRequest(url, options);
```

### Parameters

| Option                | Description                                                                                                                                                                                                 | Default     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `url`                 | URL to send request to (required).                                                                                                                                                                          |             |
| `options`             | [`RequestInit`](https://fetch.spec.whatwg.org/#requestinit) object. The entire object is passed to `fetch`, however, only the options listed below are considered for `sendBeacon` and `XMLHttpRequest`.    |             |
| `options.method`      | HTTP method to use.                                                                                                                                                                                         | `'POST'`    |
| `options.headers`     | Object of HTTP headers to use.                                                                                                                                                                              | `null`      |
| `options.body`        | A string or [`BodyInit`](https://fetch.spec.whatwg.org/#bodyinit) type for the data to send. No automatic conversion of any kind is done (e.g. you must convert to JSON or to URL encoded values yourself). | `null`      |
| `options.credentials` | A [`RequestCredentials`](https://fetch.spec.whatwg.org/#requestcredentials) string for the credentials mode to use.                                                                                         | `'include'` |

### Return value

The function returns a boolean indicating if the request was successful, with one important caveat: if `fetch` is used, it will always return `true`; it's impossible to synchronously know if a `fetch` will result in an error. Otherwise, `false` guarantees the request did not go through.

### Examples

Simple POST request

```
beforeunloadRequest('/flushSession');
```

PUT with JSON

```
beforeunloadRequest('/save', {
	method: 'PUT',
	body: JSON.stringify(data),
	headers: {
		'Content-Type': 'application/json'
	}
});
```

Using the return value

```
window.addEventListener('beforeunload', event => {
	const success = beforeunloadRequest('/save', {
		method: 'PUT',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	if (!success) {
		// Show a warning that the user might lose data if they leave the page
		event.preventDefault();
		event.returnValue = '';
	}
});
```

## Browser compatability

This library requires, at the minimum, support for `XMLHttpRequest`, including `setRequestHeaders` and `withCredentials`. [Those are supported in IE10 and above](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest#Browser_compatibility).

## Methodoloy

We first try to use [`navigator.sendBeacon`](https://www.w3.org/TR/beacon/) if it's available and the request is compatible. Compatible requests are `POST` requests with `'include'` as the credentials mode and no headers, with the exception of `Content-Type` if the data being sent is a string. `navigator.sendBeacon` can also fail if the data being sent is over the maximum size limit or due to a [browser issue with `Content-Type`](https://bugs.chromium.org/p/chromium/issues/detail?id=490015).

If `navigator.sendBeacon` is not available, if the request is not compatible, or if it otherwise fails, we then try to use synchronous [`XMLHttpRequest`](https://xhr.spec.whatwg.org/). Some [browsers disallow synchronous XHR on `beforeunload`](https://bugs.chromium.org/p/chromium/issues/detail?id=952452).

If synchronous XHR fails, we try [`fetch`](https://fetch.spec.whatwg.org/) with the [`keepalive`](https://fetch.spec.whatwg.org/#request-keepalive-flag) flag set. We do this after synchronous XHR because `fetch` with `keepalive` can fail in certain situations due to a [browser issue with headers](https://bugs.chromium.org/p/chromium/issues/detail?id=835821). This failure cannot be intercepted in a synchronous manner, so there is no way to recover with a different method.

This execution order ensures cross-browser compatability with, despite the quirks and issues with the new APIs. That being said, to guarantee the best user experience, you should aim for your requests to be compatible with `navigator.sendBeacon`. This avoids users having to wait for the synchronous XHR to complete when attempting to navigate away.
