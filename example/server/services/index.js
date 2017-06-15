'use strict';

const messages = require('./messages/messages.service.js');

module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(messages);
};
