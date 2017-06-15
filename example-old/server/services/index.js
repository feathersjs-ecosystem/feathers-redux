
/* eslint no-console: 0 */

const message = require('./message');
const authentication = require('./authentication');
const user = require('./user');

module.exports = function () { // 'function' needed as we use 'this'
  const app = this;

  app.configure(authentication);
  app.configure(user);
  app.configure(message);
};
