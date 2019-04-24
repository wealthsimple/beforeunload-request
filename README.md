# beforeunload-request

Provides a unified API to use the best method available to send data to the server on `beforeunload`.

## Motivation

There is often a need to send data to the server before a page is closed. Asynchronous XHR requests aren't guaranteed to be sent in such a scenario, so traditionally developers have used synchronous XHR requests. However, due to the poor user experience that synchronous XHR requests on `beforeunload` cause, [browsers have started disallowing them](https://bugs.chromium.org/p/chromium/issues/detail?id=952452).

There are alternatives to synchronous XHR but they all have their own quirks and browser issues to deal with (see [Implementation](#methodoloy)). This library is an attempt to unify these methods into a single API and prevent common pitfalls.

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

| Parameter             | Description                                                                                                                                                                                                                         | Default value |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `url`                 | URL to send request to                                                                                                                                                                                                              |               |
| `options`             | Object in the shape of a [`BodyInit`](https://fetch.spec.whatwg.org/#bodyinit). The entire object is eventually passed to `fetch`, however, only the following listed options are considered for `sendBeacon` and `XMLHttpRequest`. |               |
| `options.method`      | HTTP method to use                                                                                                                                                                                                                  | `'POST'`      |
| `options.headers`     | Object of HTTP headers to use                                                                                                                                                                                                       | `null`        |
| `options.body`        | Body of the request (data to send). No automatic conversion of any kind is done (e.g. you must convert to JSON or to URL encoded values yourself).                                                                                  | `null`        |
| `options.credentials` | A [`RequestCredentials`](https://fetch.spec.whatwg.org/#requestcredentials) string.                                                                                                                                                 | `'include'`   |

### Examples

Simple request

PUT save in JSON

## Methodoloy
