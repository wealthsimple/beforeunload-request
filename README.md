# beforeunload-request

Provides a unified API to use the best method available to send data to the server on `beforeunload`.

## Motivation

There is often a need to send data to the server before a page is closed. Asynchronous XHR requests aren't guaranteed to be sent in such a scenario, so traditionally developers have used synchronous XHR requests. However, due to the poor user experience that synchronous XHR requests on `beforeunload` cause, [browsers have started disallowing them](https://bugs.chromium.org/p/chromium/issues/detail?id=952452).

There are alternatives to synchronous XHR ([`navigator.sendBeacon`](https://www.w3.org/TR/beacon/) and [`fetch`](https://fetch.spec.whatwg.org/) with [`keepalive`](https://fetch.spec.whatwg.org/#request-keepalive-flag)) but those sit in a minefield of quirks and [browser](https://bugs.chromium.org/p/chromium/issues/detail?id=835821) [issues](https://bugs.chromium.org/p/chromium/issues/detail?id=490015) to navigate. This library aims to unify these methods into a single API that prevents common pitfalls (see [Methodology](#methodoloy)).

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

| Parameter             | Description                                                                                                                                                                                                                               | Default value                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `url`                 | URL to send request to.                                                                                                                                                                                                                   | None, required parameter.     |
| `options`             | Object in the shape of a [`RequestInit`](https://fetch.spec.whatwg.org/#requestinit). The entire object is eventually passed to `fetch`, however, only the following listed options are considered for `sendBeacon` and `XMLHttpRequest`. | See individual options below. |
| `options.method`      | HTTP method to use.                                                                                                                                                                                                                       | `'POST'`                      |
| `options.headers`     | Object of HTTP headers to use.                                                                                                                                                                                                            | `null`                        |
| `options.body`        | A string or [`BodyInit`](https://fetch.spec.whatwg.org/#bodyinit) type for the data to send. No automatic conversion of any kind is done (e.g. you must convert to JSON or to URL encoded values yourself).                               | `null`                        |
| `options.credentials` | A [`RequestCredentials`](https://fetch.spec.whatwg.org/#requestcredentials) string for the credentials mode to use.                                                                                                                       | `'include'`                   |

### Return value

Returns a boolean indicating whether or not _we think_ the request was a success. The limitation of this is that it's impossible to synchronously know if a `fetch` will result in an error, so we always return `true`. However, if it returns `false`, you can rest assured it did not work.

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

## Methodoloy

We first try to use [`navigator.sendBeacon`](https://www.w3.org/TR/beacon/) if it's available and if the request is compatible. Compatible requests are POST requests with `'include'` as the credentials mode and no headers, with the exception of `Content-Type` if the data being sent is a string. `navigator.sendBeacon` can also fail if the data being sent is over the maximum size limit or due to a [browser issue with `Content-Type`](https://bugs.chromium.org/p/chromium/issues/detail?id=490015).

If `navigator.sendBeacon` is not available, if the request is not compatible or if it otherwise fails, we then try to use synchronous [`XMLHttpRequest`](https://xhr.spec.whatwg.org/). This was the preferred method but can now fail as [browsers start disallowing it on `beforeunload`](https://bugs.chromium.org/p/chromium/issues/detail?id=952452).

If synchronous XHR fails, we try [`fetch`](https://fetch.spec.whatwg.org/) with the [`keepalive`](https://fetch.spec.whatwg.org/#request-keepalive-flag) flag set. We do this after synchronous XHR because `fetch` with `keepalive` [can fail in certain situations due to a browser issue with headers](https://bugs.chromium.org/p/chromium/issues/detail?id=835821). This failure cannot be intercepted in a synchronous manner, so there would be no way to recover with a different method.

This execution order ensures that the request gets sent for all browsers, despite all the quirks and ongoing issues with the new APIs. That being said, to guarantee the best user experience, you should aim that your requests be compatible with `navigator.sendBeacon` to avoid the potential of waiting for the synchronous XHR to complete when the user tries to navigate away.
