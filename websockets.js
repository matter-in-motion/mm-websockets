'use strict';
const WSServer = require('uws').Server;

const Websockets = function() {
  this.server = undefined;
};

Websockets.prototype.__initRequired = true;

Websockets.prototype.__init = function(units) {
  const settings = units.require('core.settings');
  const wsSettings = settings.websockets;
  this.pingInterval = settings.pingInterval;
  this.limit = wsSettings.limit || null;
  this.defaultType = wsSettings.type || 'application/json';
  this.rxApi = new RegExp(settings.core.api);

  let options = {}
  if (wsSettings.port) {
    options.port = wsSettings.port;
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
  connection.url = connection.upgradeReq.url;
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
    type: this.defaultType
  }
  this.message(msg);
};

Websockets.prototype.response = function(msg) {
  msg.connection.send(msg.response, err => err && this.onError(err));
};

module.exports = Websockets;
