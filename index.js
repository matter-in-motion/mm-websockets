'use strict';
const Websockets = require('./websockets');

module.exports = () => ({
  transports: { websockets: new Websockets() }
});
