
const authentication = require('feathers-authentication');
const jwt = require('feathers-authentication-jwt');
const local = require('feathers-authentication-local');

module.exports = function () { // 'function' needed as we use 'this'
  const app = this;

  const config = app.get('auth');

  app.configure(authentication(config))
    .configure(jwt())
    .configure(local());
};
