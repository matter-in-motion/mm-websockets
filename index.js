'use strict';
const WSServer = require('uws').Server;

const Transport = function(opts) {
  this.connect = opts.connect;
  this.message = opts.message;
  this.error = opts.error;
  this.close = opts.close;
};

Transport.prototype.__initRequired = true;

Transport.prototype.__init = function(units) {
  const coreSettings = units.require('core.settings').core;
  const settings = coreSettings.transports.websockets;
  this.pingInterval = settings.pingInterval;
  this.limit = settings.limit || null;
  this.defaultType = settings.type || 'application/json';
  this.rxApi = new RegExp(coreSettings.api);

  let options = {}
  if (settings.port) {
    options.port = settings.port;
  } else {
    const http = units.get('core.transport.http');

    if (!http) {
      throw Error('Websockets port or http transport should be defined');
    }

    options.server = http.server;
  }

  this.server = new WSServer(options)
    .on('connection', ws => this.onConnect(ws))
    .on('error', err => this.onError(null, err));
};

Transport.prototype.start = function() {
  this.server.startAutoPing(this.pingInterval);
};

Transport.prototype.onConnect = function(connection) {
  connection.url = connection.upgradeReq.url;
  connection
    .on('close', () => this.onClose(connection))
    .on('error', err => this.onError(connection, err))
    .on('message', (data, flags) => this.onMessage(connection, data, flags));
    // .on('ping', (data, flags) => connection.pong(data, flags))

  this.connect(connection);
};

Transport.prototype.onError = function(connection, err) {
  this.error(err);
};

Transport.prototype.onClose = function(connection) {
  connection.closed && connection.closed();
  this.close(connection);
};

Transport.prototype.onMessage = function(connection, message) {
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

Transport.prototype.response = function(msg) {
  msg.connection.send(msg.response, err => err && this.onError(err));
};

module.exports = Transport;
