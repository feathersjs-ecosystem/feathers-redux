
/* eslint max-len: 0, no-param-reassign: 0, no-underscore-dangle: 0, no-var: 0 */

const assert = require('chai').assert;
const feathersFakes = require('feathers-tests-fake-app-users');
const reduxifyServices = require('../lib').default;

const usersDb = [
  { _id: 'a', email: 'a', isVerified: true, verifyToken: null, verifyExpires: null },
  { _id: 'b', email: 'b', isVerified: true, verifyToken: null, verifyExpires: null },
];

describe('action-creators', () => {
  var db;
  var app;
  var users;
  var services;

  const valids = {
    find: {
      args: [{ query: { email: 'a' } }],
      result: {
        total: 1,
        data: [{ _id: 'a', email: 'a', isVerified: true, verifyToken: null, verifyExpires: null }],
      },
    },
    get: {
      args: ['a'],
      result: { _id: 'a', email: 'a', isVerified: true, verifyToken: null, verifyExpires: null },
    },
    create: {
      args: [{ email: 'c', isVerified: true, verifyToken: null, verifyExpires: null }],
      result: { email: 'c', isVerified: true, verifyToken: null, verifyExpires: null },
    },
    update: {
      args: ['a', { email: 'abc123', isVerified: true, verifyToken: null, verifyExpires: null }],
      result: { _id: 'a', email: 'abc123', isVerified: true, verifyToken: null, verifyExpires: null },
    },
    patch: {
      args: ['a', { email: 'xyz789' }],
      result: { _id: 'a', email: 'xyz789', isVerified: true, verifyToken: null, verifyExpires: null },
    },
    remove: {
      args: ['a'],
      result: { _id: 'a', email: 'a', isVerified: true, verifyToken: null, verifyExpires: null },
    },
  };

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersFakes.app();
    users = feathersFakes.makeDbService(app, 'users', db);
    app.use('users', users);
    services = reduxifyServices(app, ['users']);
  });

  describe('has action creator for', () => {
    Object.keys(valids).forEach(method => {
      it(method, () => {
        assert.isFunction(services.users[method]);

        const action = services.users[method].apply(this, valids[method].args);

        assert.sameMembers(Object.keys(action), ['type', 'payload']);
        assert.equal(action.type, actionType(method));
        assert.instanceOf(action.payload.promise, Promise);
      });
    });
  });

  describe('returns correct results for', () => {
    Object.keys(valids).forEach(method => {
      it(method, (done) => {
        const action = services.users[method].apply(this, valids[method].args);

        action.payload.promise
          .then(data => {
            if (method === 'create') {
              assert.isString(data._id);
              delete data._id;
            }

            assert.deepEqual(data, valids[method].result);
            done();
          })
          .catch(() => {
            assert.isNotOk(true, `.catch on ${method}`);
            done();
          });
      });
    });
  });

  describe('fails correctly for', () => {
    const invalids = {
      get: {
        args: ['z'],
      },
      update: {
        args: ['z', { email: 'abc123', isVerified: true, verifyToken: null, verifyExpires: null }],
      },
      patch: {
        args: ['z', { email: 'xyz789' }],
      },
      remove: {
        args: ['z'],
      },
    };

    Object.keys(invalids).forEach(method => {
      it(method, (done) => {
        const action = services.users[method].apply(this, invalids[method].args);

        action.payload.promise
          .then(() => {
            assert.isNotOk(true, `unexpectedly succeeded for ${method}`);
            done();
          })
          .catch(() => {
            done();
          });
      });
    });
  });
});

// Helpers

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function actionType(method) {
  return (`SERVICES_USERS_${method.toUpperCase()}`);
}
