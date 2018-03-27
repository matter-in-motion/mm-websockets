'use strict';
const WSServer = require('uws').Server;

const Websockets = function() {
  this.server = undefined;
};

Websockets.prototype.__initRequired = true;

Websockets.prototype.__init = function(units) {
  const settings = units.require('core.settings');
  this.rxApi = new RegExp(settings.core.api);

  const s = settings.websockets || {};
  this.pingInterval = s.pingInterval;
  this.limit = s.limit || null;

  const serializer = s.serializer || settings.serializers.default;
  if (serializer) {
    this.defaultSerializer = units.require(`serializers.${serializer}`);
  }

  let options = {}
  if (settings.port) {
    options.port = settings.port;
  } else {
    const http = units.get('transports.http');

    if (!http) {
      throw Error('Websockets port or http transport should be defined');
    }

    options.server = http.server;
  }

  this.server = new WSServer(options)
    .on('connection', ws => this.onConnect(ws))
    .on('error', err => this.onError(null, err));
};

Websockets.prototype.start = function() {
  this.server.startAutoPing(this.pingInterval);
};

Websockets.prototype.onConnect = function(connection) {
  const req = connection.upgradeReq;
  // Save the original url to destinct between api messages and others
  connection.url = req.url;
  // Save the serilizer mime
  const mime = req.headers.accept;
  connection.mime = mime && mime !== '*/*' ? mime : this.defaultSerializer.mime;

  // Add meta from http connection to pass it with evry message as default meta
  const meta = req.headers.authorization;
  if (meta) {
    connection.meta = meta.split(' ')[1];
  }

  connection
    .on('close', () => this.onClose(connection))
    .on('error', err => this.onError(connection, err))
    .on('message', (data, flags) => this.onMessage(connection, data, flags));
  // .on('ping', (data, flags) => connection.pong(data, flags))

  this.connect(connection);
};

Websockets.prototype.onError = function(connection, err) {
  this.error(err);
};

Websockets.prototype.onClose = function(connection) {
  connection.closed && connection.closed();
  this.close(connection);
};

Websockets.prototype.onMessage = function(connection, message) {
  //skip non api messages
  if (!this.rxApi.test(connection.url)) {
    return this.message(message);
  }

  const msg = {
    connection,
    body: message,
    mime: connection.mime,
    meta: connection.meta
  }
  this.message(msg);
};

Websockets.prototype.response = function(msg) {
  msg.connection.send(msg.response, err => err && this.onError(err));
};

module.exports = Websockets;
