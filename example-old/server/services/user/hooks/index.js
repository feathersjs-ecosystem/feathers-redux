
/* eslint no-console: 0 */

const { when, discard } = require('feathers-hooks-common');
const auth = require('feathers-authentication');
const local = require('feathers-authentication-local');

exports.before = {
  find: auth.hooks.authenticate('jwt'),
  get: auth.hooks.authenticate('jwt'),
  create: local.hooks.hashPassword(),
  update: [
    auth.hooks.authenticate('jwt'),
    local.hooks.hashPassword()
  ],
  patch: [
    auth.hooks.authenticate('jwt'),
    local.hooks.hashPassword()
  ],
  remove: auth.hooks.authenticate('jwt'),
};

exports.after = {
  all: when(hook => hook.provider, discard('password')),
  create: emailVerification, // send email to verify the email addr  ],
};

function emailVerification(hook, next) {
  const user = hook.result;

  console.log('-- Sending email to verify new user\'s email addr');
  console.log(`Dear ${user.username}, please click this link to verify your email addr.`);
  console.log(`  http://localhost:3030/socket/verify/${user.verifyToken}`);

  next(null, hook);
}
