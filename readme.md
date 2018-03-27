# Matter In Motion. Websockets transport

[![NPM Version](https://img.shields.io/npm/v/mm-websockets.svg?style=flat-square)](https://www.npmjs.com/package/mm-websockets)
[![NPM Downloads](https://img.shields.io/npm/dt/mm-websockets.svg?style=flat-square)](https://www.npmjs.com/package/mm-websockets)

Websocket transport extension for [matter in motion](https://github.com/matter-in-motion/mm) framework

## Usage

[Transport installation instructions](https://github.com/matter-in-motion/mm/blob/master/docs/transports.md)

### Protocol

Websockets from the browser:

```js
const msg = [ <request>, <data object>, <head object>, <requestId> ];
const con = new WebSocket('ws://localhost:3000/api');
con.onmessage = function(e) {
  const res = JSON.parse(e.data);
  console.log(res);
}

con.onopen = function() {
  con.send(JSON.stringify(msg));
};
```

## Settings

* __pingInterval__ — number. Ping interval in milliseconds
* __type__ string, 'application/json'. Default type of data, 'application/json' is onlt available option for now.
* __port__ number, if defined creates its own http server and listens `port`, otherwise tries to use [http transport](https://github.com/matter-in-motion/mm-http) server
* serializer — string, serializer name to be used as default for websockets messages instead of default


License: MIT.
