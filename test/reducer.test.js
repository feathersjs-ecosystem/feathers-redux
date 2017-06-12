
/* eslint no-var: 0 */

const assert = require('chai').assert;
const feathersFakes = require('feathers-tests-fake-app-users');
const reduxifyServices = require('../src').default;

const usersDb = [];

describe('reduxify:reducer - array of paths', () => {
  var db;
  var app;
  var users;
  var services;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersFakes.app();
    users = feathersFakes.makeDbService(app, 'users', db);
    app.use('users', users);
    services = reduxifyServices(app, ['users']);
  });

  it('has a reducer', () => {
    assert.isFunction(services.users.reducer);
  });

  it('returns an initial state', () => {
    const state = services.users.reducer(undefined, '@@INIT'); // action type Redux uses during init
    assert.isObject(state);
    assert.deepEqual(state, {
      isError: null,
      isLoading: false,
      isSaving: false,
      isFinished: false,
      data: null,
      queryResult: null,
      store: null
    });
  });

  ['find', 'get', 'create', 'update', 'patch', 'remove'].forEach(method => {
    describe(`returns expected state for ${method}`, () => {
      ['pending', 'fulfilled', 'rejected'].forEach(step => {
        it(`for ${step}`, () => {
          var validStates = getValidStates(false);
          if (method === 'find') { validStates = getValidStates(true, true); }
          if (method === 'get') { validStates = getValidStates(true); }

          const state = services.users.reducer({}, reducerActionType(method, step));
          assert.deepEqual(state, validStates[step]);
        });
      });
    });
  });

  ['get', 'create', 'update', 'patch', 'remove'].forEach(method => {
    describe(`does not change queryResult for ${method}`, () => {
      ['pending', 'fulfilled', 'rejected'].forEach(step => {
        it(`for ${step}`, () => {
          var validStates = getValidStates(false, false, true);
          if (method === 'find') { validStates = getValidStates(true, true, true); }
          if (method === 'get') { validStates = getValidStates(true, false, true); }

          const state = services.users.reducer(
            { queryResult: [{ a: 'a' }] }, reducerActionType(method, step)
          );
          assert.deepEqual(state, validStates[step]);
        });
      });
    });
  });

  describe('for reset', () => {
    it('resets state', () => {
      const state = services.users.reducer({}, services.users.reset());

      assert.deepEqual(state, {
        isError: null,
        isLoading: false,
        isSaving: false,
        isFinished: false,
        data: null,
        queryResult: null,
        store: null
      });
    });

    it('does not reset on isLoading', () => {
      const state = services.users.reducer({ isLoading: true }, services.users.reset());
      assert.deepEqual(state, { isLoading: true });
    });

    it('does not reset on isSaving', () => {
      const state = services.users.reducer({ isSaving: true }, services.users.reset());
      assert.deepEqual(state, { isSaving: true });
    });

    it('resets queryResult by default', () => {
      const state = services.users.reducer(
        { queryResult: [{ a: 'a' }] }, services.users.reset()
      );
      assert.deepEqual(state, {
        isError: null,
        isLoading: false,
        isSaving: false,
        isFinished: false,
        data: null,
        queryResult: null,
        store: null
      });
    });

    it('does not reset queryResult on truthy', () => {
      const state = services.users.reducer(
        { queryResult: [{ a: 'a' }] }, services.users.reset(true)
      );
      assert.deepEqual(state, {
        isError: null,
        isLoading: false,
        isSaving: false,
        isFinished: false,
        data: null,
        queryResult: [{ a: 'a' }],
        store: null
      });
    });
  });

  describe('for store', () => {
    it('resets state', () => {
      const state = services.users.reducer({}, services.users.store('harry'));

      assert.deepEqual(state, {
        store: 'harry'
      });
    });
  });
});

describe('reduxify:reducer - single path', () => {
  var db;
  var app;
  var users;
  var services;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersFakes.app();
    users = feathersFakes.makeDbService(app, 'users', db);
    app.use('users', users);
    services = reduxifyServices(app, 'users');
  });

  it('has a reducer', () => {
    assert.isFunction(services.users.reducer);
  });

  it('returns an initial state', () => {
    const state = services.users.reducer(undefined, '@@INIT'); // action type Redux uses during init
    assert.isObject(state);
    assert.deepEqual(state, {
      isError: null,
      isLoading: false,
      isSaving: false,
      isFinished: false,
      data: null,
      queryResult: null,
      store: null
    });
  });
});

describe('reduxify:reducer - path & convenience name', () => {
  var db;
  var app;
  var users;
  var services;

  beforeEach(() => {
    db = clone(usersDb);
    app = feathersFakes.app();
    users = feathersFakes.makeDbService(app, 'users', db);
    app.use('/users:slug', users);
    services = reduxifyServices(app, { '/users:slug': 'users' });
  });

  it('has a reducer', () => {
    assert.isFunction(services.users.reducer);
  });

  it('returns an initial state', () => {
    const state = services.users.reducer(undefined, '@@INIT'); // action type Redux uses during init
    assert.isObject(state);
    assert.deepEqual(state, {
      isError: null,
      isLoading: false,
      isSaving: false,
      isFinished: false,
      data: null,
      queryResult: null,
      store: null
    });
  });
});

// Helpers

function clone (obj) {
  return JSON.parse(JSON.stringify(obj));
}

function reducerActionType (method, step) {
  return {
    type: `SERVICES_USERS_${method.toUpperCase()}_${step.toUpperCase()}`,
    payload: 'xxx'
  };
}

function getValidStates (ifLoading, isFind, haveQueryResult) {
  const qr = haveQueryResult ? [{ a: 'a' }] : null;

  return {
    pending: {
      isError: null,
      isLoading: ifLoading,
      isSaving: !ifLoading,
      isFinished: false,
      data: null,
      queryResult: qr

    },
    fulfilled: {
      isError: null,
      isLoading: false,
      isSaving: false,
      isFinished: true,
      data: !isFind ? 'xxx' : null,
      queryResult: isFind ? 'xxx' : qr
    },
    rejected: {
      isError: 'xxx',
      isLoading: false,
      isSaving: false,
      isFinished: true,
      data: null,
      queryResult: qr
    }
  };
}
